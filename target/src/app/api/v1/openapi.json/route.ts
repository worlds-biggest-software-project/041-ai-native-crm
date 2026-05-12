export function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "AI-Native CRM API",
      version: "1.0.0",
      description: "REST API for the AI-Native CRM",
    },
    servers: [{ url: "/api/v1" }],
    paths: {
      "/contacts": {
        get: {
          summary: "List contacts",
          tags: ["Contacts"],
          responses: { "200": { description: "A list of contacts" } },
        },
        post: {
          summary: "Create contact",
          tags: ["Contacts"],
          responses: { "201": { description: "Contact created" } },
        },
      },
      "/contacts/{id}": {
        get: {
          summary: "Get contact",
          tags: ["Contacts"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { "200": { description: "Contact details" } },
        },
        patch: {
          summary: "Update contact",
          tags: ["Contacts"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { "200": { description: "Contact updated" } },
        },
        delete: {
          summary: "Delete contact",
          tags: ["Contacts"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { "204": { description: "Contact deleted" } },
        },
      },
      "/companies": {
        get: {
          summary: "List companies",
          tags: ["Companies"],
          responses: { "200": { description: "A list of companies" } },
        },
        post: {
          summary: "Create company",
          tags: ["Companies"],
          responses: { "201": { description: "Company created" } },
        },
      },
      "/companies/{id}": {
        get: {
          summary: "Get company",
          tags: ["Companies"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { "200": { description: "Company details" } },
        },
        patch: {
          summary: "Update company",
          tags: ["Companies"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { "200": { description: "Company updated" } },
        },
        delete: {
          summary: "Delete company",
          tags: ["Companies"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { "204": { description: "Company deleted" } },
        },
      },
      "/deals": {
        get: {
          summary: "List deals",
          tags: ["Deals"],
          responses: { "200": { description: "A list of deals" } },
        },
        post: {
          summary: "Create deal",
          tags: ["Deals"],
          responses: { "201": { description: "Deal created" } },
        },
      },
      "/deals/{id}": {
        get: {
          summary: "Get deal",
          tags: ["Deals"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { "200": { description: "Deal details" } },
        },
        patch: {
          summary: "Update deal",
          tags: ["Deals"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { "200": { description: "Deal updated" } },
        },
        delete: {
          summary: "Delete deal",
          tags: ["Deals"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { "204": { description: "Deal deleted" } },
        },
      },
      "/pipelines": {
        get: {
          summary: "List pipelines",
          tags: ["Pipelines"],
          responses: { "200": { description: "A list of pipelines" } },
        },
      },
      "/activities": {
        get: {
          summary: "List activities",
          tags: ["Activities"],
          responses: { "200": { description: "A list of activities" } },
        },
        post: {
          summary: "Create activity",
          tags: ["Activities"],
          responses: { "201": { description: "Activity created" } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };

  return Response.json(spec);
}
