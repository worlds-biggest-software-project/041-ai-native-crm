import { db } from "../src/server/db";
import { workspaces } from "../src/server/db/schema/workspaces";
import { users } from "../src/server/db/schema/users";
import { pipelines } from "../src/server/db/schema/pipelines";
import { companies } from "../src/server/db/schema/companies";
import { contacts } from "../src/server/db/schema/contacts";
import { deals } from "../src/server/db/schema/deals";
import { activities } from "../src/server/db/schema/activities";

// ---------------------------------------------------------------------------
// Sample data arrays
// ---------------------------------------------------------------------------

const COMPANY_NAMES = [
  "Acme Corp", "Globex Industries", "Initech", "Umbrella Co", "Wonka Enterprises",
  "Stark Industries", "Wayne Enterprises", "Oscorp", "LexCorp", "Cyberdyne Systems",
  "Soylent Corp", "Tyrell Corp", "Weyland-Yutani", "Massive Dynamic", "InGen",
  "Aperture Science", "Black Mesa", "Vault-Tec", "Abstergo Industries", "Hanso Foundation",
  "Dharma Initiative", "Hooli", "Pied Piper", "Raviga Capital", "Bachmanity",
  "Aviato", "Piedmont Pharma", "Sunbeam Energy", "NovaTech Solutions", "Crestline Logistics",
  "Pinnacle Data", "Summit Analytics", "Vanguard Robotics", "Meridian Cloud", "Atlas Security",
  "Beacon Financial", "Horizon Healthcare", "Nexus Manufacturing", "Prism Software", "Zenith Labs",
  "Cobalt Mining", "Sterling Partners", "Falcon Aerospace", "Ember Technologies", "Lunar Systems",
  "Quantum Networks", "Radiant Solar", "Titan Construction", "Vertex Gaming", "Cascade Water",
];

const FIRST_NAMES = [
  "Alice", "Bob", "Carol", "David", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack",
  "Kate", "Leo", "Mia", "Noah", "Olivia", "Pete", "Quinn", "Rose", "Sam", "Tara",
];

const LAST_NAMES = [
  "Johnson", "Smith", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White", "Lopez",
];

const JOB_TITLES = [
  "CEO", "CTO", "VP of Sales", "VP of Engineering", "Product Manager",
  "Head of Marketing", "Director of Operations", "Account Executive", "Software Engineer", "Data Analyst",
];

const DEAL_NAMES = [
  "Enterprise License", "Annual Contract", "Starter Plan", "Premium Upgrade", "Consulting Package",
  "Platform Migration", "Data Analytics Suite", "Security Audit", "Cloud Deployment", "Training Program",
  "Custom Integration", "Support Plan", "API Access", "White Label", "Expansion Deal",
];

const ACTIVITY_TYPES = ["email", "call", "meeting", "note", "task"];

const ACTIVITY_SUBJECTS = [
  "Follow-up call", "Product demo", "Pricing discussion", "Contract review",
  "Quarterly check-in", "Onboarding session", "Technical deep-dive", "Requirements gathering",
  "Status update", "Kickoff meeting", "Feedback session", "Strategy review",
];

const LIFECYCLE_STAGES = ["lead", "mql", "sql", "opportunity", "customer"];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomAmount(): number {
  return Math.floor(Math.random() * 200000) + 5000;
}

function randomDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  console.log("Seeding database...");

  // 1. Workspace
  const workspaceId = crypto.randomUUID();
  await db.insert(workspaces).values({
    id: workspaceId,
    name: "Demo Corp",
    slug: "demo-corp",
    plan: "pro",
  });
  console.log("  Created workspace: Demo Corp");

  // 2. Users
  const userIds: string[] = [];
  const userEntries = [
    { email: "admin@demo-corp.com", fullName: "Admin User", role: "admin" },
    { email: "alice@demo-corp.com", fullName: "Alice Johnson", role: "member" },
    { email: "bob@demo-corp.com", fullName: "Bob Smith", role: "member" },
  ];

  for (const u of userEntries) {
    const id = crypto.randomUUID();
    userIds.push(id);
    await db.insert(users).values({
      id,
      workspaceId,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
    });
  }
  console.log(`  Created ${userIds.length} users`);

  // 3. Pipeline with default stages
  const pipelineId = crypto.randomUUID();
  const stageIds = {
    lead: crypto.randomUUID(),
    qualified: crypto.randomUUID(),
    proposal: crypto.randomUUID(),
    negotiation: crypto.randomUUID(),
    won: crypto.randomUUID(),
    lost: crypto.randomUUID(),
  };

  const stages = [
    { id: stageIds.lead, name: "Lead", order: 1, probability: 10, type: "open" as const },
    { id: stageIds.qualified, name: "Qualified", order: 2, probability: 25, type: "open" as const },
    { id: stageIds.proposal, name: "Proposal", order: 3, probability: 50, type: "open" as const },
    { id: stageIds.negotiation, name: "Negotiation", order: 4, probability: 75, type: "open" as const },
    { id: stageIds.won, name: "Closed Won", order: 5, probability: 100, type: "won" as const },
    { id: stageIds.lost, name: "Closed Lost", order: 6, probability: 0, type: "lost" as const },
  ];

  await db.insert(pipelines).values({
    id: pipelineId,
    workspaceId,
    name: "Sales Pipeline",
    isDefault: true,
    stages,
  });
  console.log("  Created pipeline: Sales Pipeline");

  // 4. Companies (50)
  const companyIds: string[] = [];
  for (let i = 0; i < 50; i++) {
    const id = crypto.randomUUID();
    companyIds.push(id);
    await db.insert(companies).values({
      id,
      workspaceId,
      name: COMPANY_NAMES[i % COMPANY_NAMES.length]!,
      domain: `${COMPANY_NAMES[i % COMPANY_NAMES.length]!.toLowerCase().replace(/\s+/g, "")}.com`,
      industry: pick(["Technology", "Finance", "Healthcare", "Manufacturing", "Retail"]),
      employeeCount: Math.floor(Math.random() * 10000) + 10,
      ownerId: pick(userIds),
    });
  }
  console.log(`  Created ${companyIds.length} companies`);

  // 5. Contacts (200)
  const contactIds: string[] = [];
  for (let i = 0; i < 200; i++) {
    const id = crypto.randomUUID();
    contactIds.push(id);
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const companyId = pick(companyIds);

    await db.insert(contacts).values({
      id,
      workspaceId,
      companyId,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
      jobTitle: pick(JOB_TITLES),
      lifecycleStage: pick(LIFECYCLE_STAGES),
      ownerId: pick(userIds),
      source: pick(["website", "referral", "linkedin", "cold-outreach", "event"]),
    });
  }
  console.log(`  Created ${contactIds.length} contacts`);

  // 6. Deals (30)
  const allStageIds = [
    stageIds.lead,
    stageIds.qualified,
    stageIds.proposal,
    stageIds.negotiation,
    stageIds.won,
    stageIds.lost,
  ];
  const dealIds: string[] = [];

  for (let i = 0; i < 30; i++) {
    const id = crypto.randomUUID();
    dealIds.push(id);
    const stageId = pick(allStageIds);
    const companyId = pick(companyIds);
    const amount = randomAmount();

    await db.insert(deals).values({
      id,
      workspaceId,
      pipelineId,
      stageId,
      companyId,
      name: `${pick(DEAL_NAMES)} - ${COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)]!}`,
      amount,
      currency: "USD",
      expectedCloseDate: randomDate(-30).toISOString().slice(0, 10),
      ownerId: pick(userIds),
      source: pick(["inbound", "outbound", "referral", "partner"]),
      priority: pick(["low", "medium", "high"]),
      stageEnteredAt: randomDate(30),
    });
  }
  console.log(`  Created ${dealIds.length} deals`);

  // 7. Activities (500)
  let activityCount = 0;
  for (let i = 0; i < 500; i++) {
    const id = crypto.randomUUID();
    const occurredAt = randomDate(90);
    const activityType = pick(ACTIVITY_TYPES);

    await db.insert(activities).values({
      id,
      workspaceId,
      activityType,
      subject: `${pick(ACTIVITY_SUBJECTS)} (${activityType})`,
      occurredAt,
      ownerId: pick(userIds),
      contactId: pick(contactIds),
      companyId: pick(companyIds),
      dealId: Math.random() > 0.5 ? pick(dealIds) : undefined,
    });
    activityCount++;
  }
  console.log(`  Created ${activityCount} activities`);

  console.log("\nSeed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
