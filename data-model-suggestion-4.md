# Data Model Suggestion 4: Graph-Relational Hybrid

> Project: AI-Native CRM · Created: 2026-05-11

## Philosophy

This model combines a relational PostgreSQL layer for operational CRUD with a property graph layer for relationship-heavy queries. The core CRM entities (contacts, companies, deals) live in conventional relational tables for fast, predictable CRUD operations. On top of this, a graph abstraction layer -- implemented either as PostgreSQL tables (`graph_nodes`/`graph_edges`) or as a sidecar Neo4j/Apache AGE instance -- models the rich relationship network that a CRM naturally produces: people know people, companies have subsidiaries, contacts play different roles in different deals, and communication patterns form implicit networks.

CRM data is inherently a graph. A contact is connected to multiple companies (current employer, past employers, board seats). A deal involves multiple contacts with different roles (decision maker, champion, influencer, blocker). Contacts refer other contacts. Companies have parent-subsidiary hierarchies. Email threads create implicit relationship networks. Traditional relational CRMs flatten these rich relationships into junction tables and lose the ability to traverse them efficiently. A graph layer preserves relationship semantics and enables queries that are impractical in pure SQL: "find all contacts who know someone at Company X," "trace the chain of introductions that led to this deal," or "identify conflict-of-interest relationships across deals."

Neo4j's property graph model stores nodes and relationships as first-class citizens with O(1) pointer-based traversal, making multi-hop relationship queries orders of magnitude faster than SQL JOINs across junction tables. For an AI-native CRM, the graph layer provides a natural substrate for relationship intelligence, network analysis, and recommendation engines.

**Best for:** Teams building relationship intelligence features, platforms where network analysis and referral tracking are core differentiators, and complex enterprise sales with multi-stakeholder deal structures.

**Trade-offs:**
- (+) Multi-hop relationship queries are orders of magnitude faster than SQL JOINs
- (+) Natural substrate for AI-powered relationship intelligence and recommendations
- (+) Rich relationship semantics (typed, directed, timestamped edges with properties)
- (+) Enables features competitors can't match: influence mapping, referral chains, conflict detection
- (+) Graph visualization in the UI creates a compelling user experience
- (-) Dual data store increases operational complexity (PostgreSQL + graph engine)
- (-) Data consistency between relational and graph layers must be carefully managed
- (-) Graph database expertise is rarer than SQL expertise on most teams
- (-) Graph queries (Cypher/openCypher) are less familiar to most developers than SQL
- (-) Additional infrastructure cost if using a separate graph database (Neo4j)

---

## Standards Alignment

| Standard | How It's Used |
|----------|---------------|
| RFC 6350 (vCard 4.0) | Contact node properties align with vCard fields; RELATED property maps to graph edges |
| RFC 5545 (iCalendar) | Meeting nodes carry iCalendar-aligned properties |
| ISO 8601 | All timestamps in ISO 8601 TIMESTAMPTZ format |
| ISO 3166-1 | Country codes as node properties |
| openCypher | Graph query language specification for the graph query layer |
| Apache TinkerPop / Gremlin | Alternative graph traversal API if using JanusGraph or Neptune |
| W3C RDF/OWL | Relationship ontology informed by RDF relationship modeling patterns |
| GDPR Art. 6/14/25 | Enrichment edges carry provenance properties; graph enables data lineage traversal |
| MCP (2025-11-25) | Graph queries exposed as MCP tools; relationship context injected into AI agent prompts |
| OAuth 2.0 | OAuth connections stored in relational layer |

---

## Relational Layer (Operational CRUD)

```sql
-- ============================================================
-- TENANCY & USERS (relational -- identical to other models)
-- ============================================================

CREATE TABLE workspaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    plan            VARCHAR(50) NOT NULL DEFAULT 'free',
    settings        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email           VARCHAR(320) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'member',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, email)
);

CREATE INDEX idx_users_workspace ON users(workspace_id);

-- ============================================================
-- CONTACTS (relational for CRUD; mirrored as graph nodes)
-- ============================================================

CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    full_name       VARCHAR(500) NOT NULL,
    email           VARCHAR(320),
    phone           VARCHAR(50),
    job_title       VARCHAR(255),
    department      VARCHAR(255),
    city            VARCHAR(255),
    country_code    CHAR(2),
    linkedin_url    TEXT,
    lifecycle_stage VARCHAR(50) DEFAULT 'lead',
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    source          VARCHAR(100),
    -- AI scores
    lead_score          NUMERIC(7,4),
    lead_score_label    VARCHAR(20),
    -- Graph metadata
    graph_node_id   UUID,                   -- reference to graph_nodes.id
    -- Activity stats
    last_activity_at    TIMESTAMPTZ,
    email_count         INTEGER DEFAULT 0,
    meeting_count       INTEGER DEFAULT 0,
    -- Relationship intelligence (denormalized from graph)
    connection_count    INTEGER DEFAULT 0,   -- total graph connections
    influence_score     NUMERIC(7,4),        -- PageRank-derived influence metric
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_email ON contacts(workspace_id, email);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_lifecycle ON contacts(workspace_id, lifecycle_stage);
CREATE INDEX idx_contacts_influence ON contacts(workspace_id, influence_score DESC NULLS LAST);
CREATE INDEX idx_contacts_graph_node ON contacts(graph_node_id);

-- ============================================================
-- COMPANIES (relational for CRUD; mirrored as graph nodes)
-- ============================================================

CREATE TABLE companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(500) NOT NULL,
    domain          VARCHAR(255),
    industry        VARCHAR(255),
    employee_count  INTEGER,
    annual_revenue  BIGINT,
    revenue_currency VARCHAR(3) DEFAULT 'USD',
    country_code    CHAR(2),
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Graph metadata
    graph_node_id   UUID,
    -- Hierarchy (relational shortcut for simple parent lookup)
    parent_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    -- Denormalized stats
    contact_count       INTEGER DEFAULT 0,
    open_deal_count     INTEGER DEFAULT 0,
    subsidiary_count    INTEGER DEFAULT 0,
    last_activity_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_workspace ON companies(workspace_id);
CREATE INDEX idx_companies_domain ON companies(workspace_id, domain);
CREATE INDEX idx_companies_parent ON companies(parent_company_id);
CREATE INDEX idx_companies_graph_node ON companies(graph_node_id);

-- ============================================================
-- DEALS (relational for CRUD; mirrored as graph nodes)
-- ============================================================

CREATE TABLE pipelines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_stages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    display_order   INTEGER NOT NULL DEFAULT 0,
    probability     NUMERIC(5,2) DEFAULT 0,
    stage_type      VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
    stage_id        UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
    company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
    name            VARCHAR(500) NOT NULL,
    amount          BIGINT,
    currency        VARCHAR(3) DEFAULT 'USD',
    expected_close_date DATE,
    actual_close_date   DATE,
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    priority        VARCHAR(20) DEFAULT 'medium',
    -- Graph metadata
    graph_node_id   UUID,
    -- AI scores
    health_score        NUMERIC(7,4),
    health_label        VARCHAR(20),
    -- Stakeholder complexity (denormalized from graph)
    stakeholder_count   INTEGER DEFAULT 0,
    champion_identified BOOLEAN DEFAULT false,
    blocker_identified  BOOLEAN DEFAULT false,
    -- Activity stats
    last_activity_at    TIMESTAMPTZ,
    email_count         INTEGER DEFAULT 0,
    meeting_count       INTEGER DEFAULT 0,
    stage_entered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_workspace ON deals(workspace_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id, stage_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_close_date ON deals(workspace_id, expected_close_date);
CREATE INDEX idx_deals_graph_node ON deals(graph_node_id);
```

---

## Graph Layer (Relationship Intelligence)

```sql
-- ============================================================
-- GRAPH NODES — every CRM entity is also a graph node
-- ============================================================
-- This table provides a unified node identity for graph traversal.
-- Each node links back to its source relational table via entity_type/entity_id.

CREATE TABLE graph_nodes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    node_type       VARCHAR(50) NOT NULL,   -- contact, company, deal, meeting, email_thread
    entity_id       UUID NOT NULL,          -- FK to the relational table (contacts.id, companies.id, etc.)
    -- Denormalized display fields for fast graph rendering
    display_name    VARCHAR(500) NOT NULL,
    display_label   VARCHAR(100),           -- e.g., "VP Engineering at Acme"
    avatar_url      TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    -- Computed graph metrics (updated by background graph analytics)
    degree          INTEGER DEFAULT 0,      -- total edge count
    in_degree       INTEGER DEFAULT 0,      -- incoming edge count
    out_degree      INTEGER DEFAULT 0,      -- outgoing edge count
    pagerank        NUMERIC(10,8) DEFAULT 0,  -- PageRank centrality score
    betweenness     NUMERIC(10,8) DEFAULT 0,  -- betweenness centrality
    cluster_id      INTEGER,                -- community detection cluster assignment
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, node_type, entity_id)
);

CREATE INDEX idx_graph_nodes_workspace ON graph_nodes(workspace_id, node_type);
CREATE INDEX idx_graph_nodes_entity ON graph_nodes(node_type, entity_id);
CREATE INDEX idx_graph_nodes_pagerank ON graph_nodes(workspace_id, pagerank DESC);
CREATE INDEX idx_graph_nodes_cluster ON graph_nodes(workspace_id, cluster_id);

-- ============================================================
-- GRAPH EDGES — typed, directed, timestamped relationships
-- ============================================================

CREATE TABLE graph_edges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_node_id  UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    target_node_id  UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    edge_type       VARCHAR(100) NOT NULL,
    -- Edge types for CRM domain:
    --   WORKS_AT          (contact -> company)         current employment
    --   WORKED_AT         (contact -> company)         past employment
    --   KNOWS             (contact -> contact)         interpersonal relationship
    --   REFERRED_BY       (contact -> contact)         referral chain
    --   REPORTS_TO        (contact -> contact)         organizational hierarchy
    --   DECISION_MAKER    (contact -> deal)            deal stakeholder role
    --   CHAMPION          (contact -> deal)            deal champion
    --   INFLUENCER        (contact -> deal)            deal influencer
    --   BLOCKER           (contact -> deal)            deal blocker
    --   USER              (contact -> deal)            end user in the deal
    --   SUBSIDIARY_OF     (company -> company)         corporate hierarchy
    --   PARTNER_OF        (company -> company)         partnership relationship
    --   COMPETITOR_OF     (company -> company)         competitive relationship
    --   EMAILED           (contact -> contact)         communication edge (weighted)
    --   MET_WITH          (contact -> contact)         meeting co-attendance
    --   INTRODUCED        (contact -> contact -> deal) warm introduction
    --   ASSOCIATED_WITH   (deal -> company)            deal-company association
    --
    -- Relationship properties
    properties      JSONB NOT NULL DEFAULT '{}',
    -- Example properties for WORKS_AT:
    -- {
    --   "job_title": "VP Engineering",
    --   "department": "Engineering",
    --   "started_at": "2022-03-01",
    --   "is_current": true
    -- }
    --
    -- Example properties for EMAILED:
    -- {
    --   "email_count": 15,
    --   "last_email_at": "2026-05-10T14:30:00Z",
    --   "avg_response_time_hours": 2.3,
    --   "direction_ratio": 0.6  -- 60% outbound
    -- }
    --
    -- Example properties for CHAMPION:
    -- {
    --   "confidence": 0.85,
    --   "identified_by": "ai",
    --   "signals": ["scheduled 3 internal demos", "forwarded proposal to CFO"]
    -- }
    --
    -- Example properties for SUBSIDIARY_OF:
    -- {
    --   "ownership_percentage": 100,
    --   "relationship_type": "wholly_owned",
    --   "jurisdiction": "US-DE"
    -- }
    weight          NUMERIC(10,4) DEFAULT 1.0,  -- edge weight for graph algorithms
    confidence      NUMERIC(5,4),               -- AI confidence for inferred edges
    source          VARCHAR(50),                -- manual, email_sync, calendar_sync, ai_inferred, import
    is_active       BOOLEAN NOT NULL DEFAULT true,
    valid_from      TIMESTAMPTZ DEFAULT now(),   -- temporal validity start
    valid_to        TIMESTAMPTZ,                 -- temporal validity end (NULL = current)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_graph_edges_source ON graph_edges(source_node_id, edge_type);
CREATE INDEX idx_graph_edges_target ON graph_edges(target_node_id, edge_type);
CREATE INDEX idx_graph_edges_workspace ON graph_edges(workspace_id, edge_type);
CREATE INDEX idx_graph_edges_type ON graph_edges(edge_type);
CREATE INDEX idx_graph_edges_properties ON graph_edges USING GIN (properties);
CREATE INDEX idx_graph_edges_active ON graph_edges(workspace_id, is_active) WHERE is_active = true;
-- Composite index for common traversal pattern
CREATE INDEX idx_graph_edges_traversal ON graph_edges(source_node_id, edge_type, target_node_id)
    WHERE is_active = true;

-- ============================================================
-- GRAPH ANALYTICS RESULTS — stored output of periodic graph computations
-- ============================================================

CREATE TABLE graph_analytics_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    algorithm       VARCHAR(100) NOT NULL,  -- pagerank, community_detection, shortest_path, influence_propagation
    parameters      JSONB NOT NULL DEFAULT '{}',
    -- Example: {"damping_factor": 0.85, "iterations": 20, "convergence_threshold": 0.0001}
    node_count      INTEGER,
    edge_count      INTEGER,
    execution_time_ms BIGINT,
    status          VARCHAR(20) NOT NULL DEFAULT 'running',
    results_summary JSONB,
    -- Example: {"clusters_found": 12, "modularity": 0.73, "top_pagerank_nodes": [...]}
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_graph_analytics_workspace ON graph_analytics_runs(workspace_id, started_at DESC);

-- ============================================================
-- RELATIONSHIP SUGGESTIONS — AI-generated relationship recommendations
-- ============================================================

CREATE TABLE relationship_suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_node_id  UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    target_node_id  UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    suggested_edge_type VARCHAR(100) NOT NULL,
    reason          TEXT NOT NULL,           -- human-readable explanation
    -- Example: "Jane Smith and John Doe exchanged 12 emails in the last 30 days and
    --           attended 3 meetings together, suggesting a KNOWS relationship."
    evidence        JSONB NOT NULL,
    -- {
    --   "email_count": 12,
    --   "meeting_co_attendance": 3,
    --   "shared_deals": ["uuid"],
    --   "linkedin_connection": true,
    --   "signals": ["frequent email exchange", "meeting co-attendance", "same company"]
    -- }
    confidence      NUMERIC(5,4) NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected, ignored
    reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_relationship_suggestions_workspace ON relationship_suggestions(workspace_id, status);
CREATE INDEX idx_relationship_suggestions_source ON relationship_suggestions(source_node_id);
```

---

## Activities & Communication

```sql
-- ============================================================
-- ACTIVITIES (relational; also create EMAILED/MET_WITH graph edges)
-- ============================================================

CREATE TABLE activities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    activity_type   VARCHAR(50) NOT NULL,
    subject         VARCHAR(1000),
    body            TEXT,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_minutes INTEGER,
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
    company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
    deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
    -- Graph edge created from this activity
    graph_edge_id   UUID REFERENCES graph_edges(id) ON DELETE SET NULL,
    -- Email-specific fields (only for activity_type = 'email')
    email_message_id    VARCHAR(500),
    email_thread_id     VARCHAR(500),
    email_direction     VARCHAR(10),
    email_from          VARCHAR(320),
    email_to            TEXT[],
    email_has_attachments BOOLEAN DEFAULT false,
    email_opened_at     TIMESTAMPTZ,
    email_open_count    INTEGER DEFAULT 0,
    -- Meeting-specific fields (only for activity_type = 'meeting')
    meeting_start_at    TIMESTAMPTZ,
    meeting_end_at      TIMESTAMPTZ,
    meeting_location    VARCHAR(500),
    meeting_conference_url TEXT,
    meeting_attendee_emails TEXT[],
    meeting_provider    VARCHAR(20),
    meeting_provider_id VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_workspace ON activities(workspace_id, occurred_at DESC);
CREATE INDEX idx_activities_contact ON activities(contact_id, occurred_at DESC);
CREATE INDEX idx_activities_deal ON activities(deal_id, occurred_at DESC);
CREATE INDEX idx_activities_company ON activities(company_id, occurred_at DESC);
CREATE INDEX idx_activities_type ON activities(workspace_id, activity_type);
CREATE INDEX idx_activities_email_thread ON activities(email_thread_id) WHERE email_thread_id IS NOT NULL;

-- ============================================================
-- TASKS
-- ============================================================

CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title           VARCHAR(1000) NOT NULL,
    description     TEXT,
    due_at          TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    priority        VARCHAR(20) DEFAULT 'medium',
    status          VARCHAR(20) DEFAULT 'todo',
    assignee_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id, status);
CREATE INDEX idx_tasks_due ON tasks(workspace_id, due_at);
```

---

## AI Features

```sql
-- ============================================================
-- AI: MEETING SUMMARIES & FOLLOW-UPS
-- ============================================================

CREATE TABLE meeting_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id     UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    summary_text    TEXT NOT NULL,
    key_points      TEXT[],
    action_items    TEXT[],
    sentiment       VARCHAR(20),
    -- Relationship insights extracted by AI
    relationship_signals JSONB,
    -- Example:
    -- {
    --   "new_stakeholders_mentioned": ["CFO Sarah Chen"],
    --   "champion_signals": ["offered to run internal demo"],
    --   "blocker_signals": [],
    --   "competitor_mentions": ["Salesforce"],
    --   "suggested_edges": [
    --     {"source": "contact-uuid", "target": "contact-uuid", "type": "INTRODUCED", "confidence": 0.8}
    --   ]
    -- }
    model_id        VARCHAR(100) NOT NULL,
    confidence      NUMERIC(5,4),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meeting_summaries_activity ON meeting_summaries(activity_id);

CREATE TABLE follow_up_drafts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    activity_id     UUID REFERENCES activities(id) ON DELETE SET NULL,
    deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    subject         VARCHAR(1000),
    body_text       TEXT NOT NULL,
    body_html       TEXT,
    status          VARCHAR(20) DEFAULT 'draft',
    model_id        VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at         TIMESTAMPTZ
);

-- ============================================================
-- AI: SCORING (graph-enhanced)
-- ============================================================

CREATE TABLE scoring_models (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    model_type      VARCHAR(50) NOT NULL,
    algorithm       VARCHAR(100),
    version         INTEGER NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT false,
    -- Graph features used by this model
    graph_features  TEXT[],
    -- Example: ["pagerank", "degree_centrality", "shortest_path_to_champion", "cluster_overlap"]
    training_metadata JSONB,
    trained_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE score_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    model_id        UUID NOT NULL REFERENCES scoring_models(id) ON DELETE CASCADE,
    score           NUMERIC(7,4) NOT NULL,
    label           VARCHAR(20),
    features        JSONB,
    -- Graph features included:
    -- {
    --   "email_response_rate": 0.85,
    --   "meeting_frequency": 0.3,
    --   "pagerank": 0.00045,
    --   "betweenness_centrality": 0.012,
    --   "degree": 15,
    --   "shortest_path_to_decision_maker": 2,
    --   "cluster_overlap_with_won_deals": 0.7,
    --   "champion_confidence": 0.85
    -- }
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_score_history_entity ON score_history(entity_type, entity_id, computed_at DESC);

-- ============================================================
-- ENRICHMENT (with graph provenance)
-- ============================================================

CREATE TABLE enrichment_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    source_type     VARCHAR(50) NOT NULL,
    base_url        TEXT,
    gdpr_basis      VARCHAR(50),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE enrichment_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_id       UUID NOT NULL REFERENCES enrichment_sources(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    field_name      VARCHAR(100) NOT NULL,
    old_value       TEXT,
    new_value       TEXT,
    confidence      NUMERIC(5,4),
    source_url      TEXT,
    -- Graph edges created by this enrichment
    created_edge_ids UUID[],
    enriched_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    status          VARCHAR(20) DEFAULT 'pending',
    reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ
);

CREATE INDEX idx_enrichment_log_entity ON enrichment_log(entity_type, entity_id);
```

---

## Integration & Infrastructure

```sql
-- ============================================================
-- OAUTH CONNECTIONS
-- ============================================================

CREATE TABLE oauth_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(50) NOT NULL,
    access_token    TEXT NOT NULL,
    refresh_token   TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes          TEXT[],
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_sync_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id, provider)
);

-- ============================================================
-- WEBHOOKS
-- ============================================================

CREATE TABLE webhooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    events          TEXT[] NOT NULL,
    secret          VARCHAR(255) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- MCP TOOLS (with graph query capabilities)
-- ============================================================

CREATE TABLE mcp_tools (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    tool_name       VARCHAR(255) NOT NULL,
    description     TEXT,
    input_schema    JSONB NOT NULL,
    handler_type    VARCHAR(50) NOT NULL,
    handler_config  JSONB NOT NULL,
    -- Graph-specific MCP tools expose relationship queries:
    -- Example: {"type": "graph_query", "query_template": "find_path_between_nodes"}
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, tool_name)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    changes         JSONB,
    ip_address      INET,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_workspace ON audit_log(workspace_id, occurred_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation ON contacts
    USING (workspace_id = current_setting('app.current_workspace_id')::UUID);
CREATE POLICY workspace_isolation ON companies
    USING (workspace_id = current_setting('app.current_workspace_id')::UUID);
CREATE POLICY workspace_isolation ON deals
    USING (workspace_id = current_setting('app.current_workspace_id')::UUID);
CREATE POLICY workspace_isolation ON graph_nodes
    USING (workspace_id = current_setting('app.current_workspace_id')::UUID);
CREATE POLICY workspace_isolation ON graph_edges
    USING (workspace_id = current_setting('app.current_workspace_id')::UUID);
```

---

## Example Graph Queries

### Find All People Connected to a Contact (2 hops)

```sql
-- Find contacts within 2 hops of a given contact (relationship network)
WITH RECURSIVE contact_network AS (
    -- Start from the target contact's graph node
    SELECT
        gn.id AS node_id,
        gn.entity_id AS contact_id,
        gn.display_name,
        0 AS depth,
        ARRAY[gn.id] AS path
    FROM graph_nodes gn
    WHERE gn.entity_id = 'target-contact-uuid'
      AND gn.node_type = 'contact'
      AND gn.workspace_id = 'workspace-uuid'

    UNION ALL

    -- Traverse edges (both directions) up to depth 2
    SELECT
        gn2.id,
        gn2.entity_id,
        gn2.display_name,
        cn.depth + 1,
        cn.path || gn2.id
    FROM contact_network cn
    JOIN graph_edges ge ON (
        (ge.source_node_id = cn.node_id OR ge.target_node_id = cn.node_id)
        AND ge.is_active = true
        AND ge.edge_type IN ('KNOWS', 'WORKS_AT', 'REFERRED_BY', 'EMAILED', 'MET_WITH')
    )
    JOIN graph_nodes gn2 ON (
        gn2.id = CASE
            WHEN ge.source_node_id = cn.node_id THEN ge.target_node_id
            ELSE ge.source_node_id
        END
        AND gn2.node_type = 'contact'
    )
    WHERE cn.depth < 2
      AND NOT gn2.id = ANY(cn.path)  -- prevent cycles
)
SELECT DISTINCT contact_id, display_name, depth
FROM contact_network
WHERE depth > 0
ORDER BY depth, display_name;
```

### Find the Shortest Introduction Path to a Decision Maker

```sql
-- Find how to get an introduction to a decision maker at a target company
WITH RECURSIVE intro_path AS (
    -- Start from all contacts we own (our team's contacts)
    SELECT
        gn.id AS node_id,
        gn.display_name,
        0 AS depth,
        ARRAY[gn.id] AS path,
        ARRAY[gn.display_name] AS name_path,
        ARRAY['START']::TEXT[] AS edge_path
    FROM graph_nodes gn
    JOIN contacts c ON c.graph_node_id = gn.id
    WHERE gn.workspace_id = 'workspace-uuid'
      AND gn.node_type = 'contact'
      AND c.owner_id IS NOT NULL  -- contacts owned by our team

    UNION ALL

    SELECT
        gn2.id,
        gn2.display_name,
        ip.depth + 1,
        ip.path || gn2.id,
        ip.name_path || gn2.display_name,
        ip.edge_path || ge.edge_type
    FROM intro_path ip
    JOIN graph_edges ge ON ge.source_node_id = ip.node_id
      AND ge.is_active = true
      AND ge.edge_type IN ('KNOWS', 'REFERRED_BY', 'WORKS_AT', 'MET_WITH')
    JOIN graph_nodes gn2 ON gn2.id = ge.target_node_id
    WHERE ip.depth < 4
      AND NOT gn2.id = ANY(ip.path)
)
SELECT
    ip.name_path,
    ip.edge_path,
    ip.depth AS hops
FROM intro_path ip
JOIN graph_nodes target_gn ON target_gn.id = ip.node_id
JOIN contacts target_c ON target_c.graph_node_id = target_gn.id
WHERE target_c.company_id = 'target-company-uuid'
  AND target_c.job_title ILIKE '%VP%' OR target_c.job_title ILIKE '%Director%'
ORDER BY ip.depth ASC
LIMIT 5;
```

### Deal Stakeholder Map

```sql
-- Get the full stakeholder map for a deal with relationship roles
SELECT
    c.id AS contact_id,
    c.full_name,
    c.job_title,
    c.email,
    ge.edge_type AS stakeholder_role,
    ge.properties->>'confidence' AS role_confidence,
    ge.properties->>'signals' AS role_signals,
    ge.source AS identified_by,
    c.influence_score,
    c.lead_score
FROM graph_edges ge
JOIN graph_nodes deal_node ON deal_node.id = ge.target_node_id
    AND deal_node.node_type = 'deal'
    AND deal_node.entity_id = 'deal-uuid'
JOIN graph_nodes contact_node ON contact_node.id = ge.source_node_id
    AND contact_node.node_type = 'contact'
JOIN contacts c ON c.graph_node_id = contact_node.id
WHERE ge.edge_type IN ('DECISION_MAKER', 'CHAMPION', 'INFLUENCER', 'BLOCKER', 'USER')
  AND ge.is_active = true
ORDER BY
    CASE ge.edge_type
        WHEN 'DECISION_MAKER' THEN 1
        WHEN 'CHAMPION' THEN 2
        WHEN 'BLOCKER' THEN 3
        WHEN 'INFLUENCER' THEN 4
        WHEN 'USER' THEN 5
    END;
```

### Communication Heatmap Between Contacts in a Deal

```sql
-- Find communication intensity between all stakeholders in a deal
SELECT
    c1.full_name AS from_contact,
    c2.full_name AS to_contact,
    ge.edge_type,
    (ge.properties->>'email_count')::INTEGER AS email_count,
    ge.properties->>'last_email_at' AS last_email,
    (ge.properties->>'avg_response_time_hours')::NUMERIC AS avg_response_hours,
    ge.weight AS relationship_strength
FROM graph_edges ge
JOIN graph_nodes gn1 ON gn1.id = ge.source_node_id AND gn1.node_type = 'contact'
JOIN graph_nodes gn2 ON gn2.id = ge.target_node_id AND gn2.node_type = 'contact'
JOIN contacts c1 ON c1.graph_node_id = gn1.id
JOIN contacts c2 ON c2.graph_node_id = gn2.id
WHERE ge.edge_type = 'EMAILED'
  AND ge.is_active = true
  -- Filter to contacts involved in a specific deal
  AND gn1.id IN (
      SELECT ge2.source_node_id FROM graph_edges ge2
      JOIN graph_nodes deal_gn ON deal_gn.id = ge2.target_node_id
        AND deal_gn.node_type = 'deal' AND deal_gn.entity_id = 'deal-uuid'
      WHERE ge2.edge_type IN ('DECISION_MAKER', 'CHAMPION', 'INFLUENCER', 'BLOCKER', 'USER')
  )
ORDER BY ge.weight DESC;
```

### Conflict of Interest Detection

```sql
-- Find contacts who are stakeholders in competing deals
SELECT
    c.full_name,
    c.email,
    c.job_title,
    d1.name AS deal_1,
    ge1.edge_type AS role_in_deal_1,
    d2.name AS deal_2,
    ge2.edge_type AS role_in_deal_2,
    comp.name AS company_name
FROM contacts c
JOIN graph_nodes cn ON cn.entity_id = c.id AND cn.node_type = 'contact'
-- First deal involvement
JOIN graph_edges ge1 ON ge1.source_node_id = cn.id
    AND ge1.edge_type IN ('DECISION_MAKER', 'CHAMPION', 'INFLUENCER')
    AND ge1.is_active = true
JOIN graph_nodes dn1 ON dn1.id = ge1.target_node_id AND dn1.node_type = 'deal'
JOIN deals d1 ON d1.id = dn1.entity_id AND d1.actual_close_date IS NULL
-- Second deal involvement
JOIN graph_edges ge2 ON ge2.source_node_id = cn.id
    AND ge2.edge_type IN ('DECISION_MAKER', 'CHAMPION', 'INFLUENCER')
    AND ge2.is_active = true
    AND ge2.target_node_id != ge1.target_node_id
JOIN graph_nodes dn2 ON dn2.id = ge2.target_node_id AND dn2.node_type = 'deal'
JOIN deals d2 ON d2.id = dn2.entity_id AND d2.actual_close_date IS NULL
-- Same company
JOIN companies comp ON comp.id = d1.company_id AND comp.id = d2.company_id
WHERE c.workspace_id = 'workspace-uuid'
  AND d1.id < d2.id;  -- avoid duplicate pairs
```

---

## Table Count Summary

| Category | Tables | Notes |
|----------|--------|-------|
| Tenancy & Users | 2 | workspaces, users |
| CRM Core (Relational) | 5 | contacts, companies, pipelines, pipeline_stages, deals |
| Graph Layer | 4 | graph_nodes, graph_edges, graph_analytics_runs, relationship_suggestions |
| Activities | 2 | activities, tasks |
| AI Features | 5 | meeting_summaries, follow_up_drafts, scoring_models, score_history |
| Enrichment | 2 | enrichment_sources, enrichment_log |
| Integration | 3 | oauth_connections, webhooks, mcp_tools |
| Audit | 1 | audit_log |
| **Total** | **24** | |

---

## Key Design Decisions

1. **Dual-layer architecture: relational for CRUD, graph for relationships** -- Core entity tables (contacts, companies, deals) serve fast CRUD operations and standard list/filter queries. The graph layer (graph_nodes, graph_edges) serves relationship traversal, network analysis, and path-finding queries. Each layer uses the storage engine optimized for its query pattern.

2. **Graph implemented in PostgreSQL (not a separate database)** -- While Neo4j offers superior graph query performance for very large graphs, implementing the graph layer as PostgreSQL tables avoids the operational complexity of a second database, ensures transactional consistency between relational and graph data, and leverages existing PostgreSQL expertise. Apache AGE (PostgreSQL extension for openCypher) can be added later for native graph query syntax if needed.

3. **Temporal edges with valid_from/valid_to** -- Graph edges have temporal validity windows. When a contact changes companies, the WORKS_AT edge gets `valid_to` set and a new edge is created. This preserves the full relationship history and enables temporal graph queries ("who was connected to whom when this deal closed?").

4. **Communication edges are weighted and aggregated** -- Rather than creating one edge per email, EMAILED edges aggregate communication statistics (email_count, avg_response_time, direction_ratio) as properties. This keeps the graph compact while preserving the signal needed for relationship strength scoring.

5. **AI-inferred relationships with confidence scores** -- The system can automatically create graph edges from email/calendar data (EMAILED, MET_WITH) and from AI analysis of meeting transcripts (CHAMPION, BLOCKER). Each inferred edge carries a confidence score and source attribution. The `relationship_suggestions` table holds proposed edges for human review before they become active.

6. **Graph centrality metrics on nodes** -- PageRank, betweenness centrality, and community cluster IDs are pre-computed by background graph analytics jobs and stored on graph_nodes. These metrics are denormalized back to the relational contact table as `influence_score` and `connection_count` for use in list views and scoring models.

7. **Graph features feed ML scoring models** -- The `scoring_models` table includes a `graph_features` field listing which graph metrics the model uses. Deal health scoring can incorporate features like "shortest path to decision maker," "cluster overlap with won deals," and "champion confidence" -- features that are impossible to compute from flat relational data alone.

8. **Meeting summaries extract relationship signals** -- When AI generates meeting summaries, it also extracts `relationship_signals` -- new stakeholders mentioned, champion/blocker signals, and suggested graph edges. This closes the loop between AI summarization and graph maintenance.

9. **Stakeholder complexity metrics on deals** -- Deals carry denormalized graph-derived fields (`stakeholder_count`, `champion_identified`, `blocker_identified`) that serve both the deal list UI and the deal health scoring model. These are updated whenever deal-stakeholder graph edges change.

10. **Recursive CTE-based graph traversal** -- All graph queries use PostgreSQL recursive CTEs with cycle detection (the `path` array prevents revisiting nodes). While less performant than native graph databases for deep traversals (>4 hops), this is sufficient for CRM relationship networks where most meaningful paths are 2-3 hops. The `idx_graph_edges_traversal` composite index optimizes the most common traversal pattern.
