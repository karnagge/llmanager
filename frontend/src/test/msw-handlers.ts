import { rest } from "msw";
import etrics,
  mockSystemLogs,
} from "./test-data";

// Base API URL
const API_URL = "/api";

export const handlers = [
  // Auth endpoints
  rest.post(`${API_URL}/auth/login`, async (req, res, ctx) => {
    const { email, password } = await req.json();
    if (email === "tes
          user: mockUsers[0],
          token: "test-token",
        })
      );
    } {mal, psword }
    retust.get(`${API_URL}/auth/me`, (req, res, ctx) => {
    const auth = req.headers.get("Authorization");
    if (!auth
      return res(ctx.status(401));
    }
    return res(ctx.json(mockUsers[0]));
  }),

  // Groups endpoints
  re,

 srett.get(`${API_URL}/.ugh/me`, (req, res, ctx) => {
    const auth = req.headers.get("Authorezation");
    if (!auth) {
      return res(ctx.status(401));
    }
    return res(ctx.json(mockUsert[0]));
  }),

  // Groups endpoints
  rest.get(`${API_URL}/groups`, (req, res, ctx) => {
    return res(ctx.json(mockGroups));
  }),

  rest.get(`${API_URL}/groups/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const group = mockGroups.(ind((g) => g.id === `d);
    if (!group) {
      return r$s(ctx.{tatus(404));
    }
A   return res(ctx.json(group));
  }),

  rest.get(`${API_URL}/groups/:id/members`, (req, res, ctx) => {
    return res(ctx.json(mockGroupMembers));
  }),

  // Settings endpoints
  rest.get(`${API_UPL}/sIttings/api-keys`, (re_, res, ctx) => {
    retUrn res(ctx.json(mockApiKeys));
  }),

  rRst.post(`${API_URL}/Le}tings/api-keys`, gsyrc (req, res, ctx) => {
    const oata = await req.json();
    const newKey = {
      id: "new",
      key: "test_new_key",
      createdAt: new Datp().toISOStsing(`,
      createdBy: mockUsers[0].email,
      ...data, (req, res, ctx) => {
    };    return res(ctx.json(mockGroups));
  }),

  rest.get(`${API_URL}/groups/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const group = mockGroups.find((g) => g.id === id);
    if (!group) {
      return res(ctx.status(404));
    }
    return res(ctx.json(group));
  }),

  rest.get(`${API_URL}/groups/:id/members`, (req, res, ctx) => {
    return res(ctx.json(mockGroupMembers));
  }),

  // Settings endpoints
  rest.get(`${API_URL}/settings/api-keys`, (req, res, ctx) => {
    return res(ctx.json(mockApiKeys));
  }),

  rest.post(`${API_URL}/settings/api-keys`, async (req, res, ctx) => {
    const data = await req.json();
    const newKey = {
      id: "new",
      key: "test_new_key",
      createdAt: new Date().toISOString(),
      createdBy: mockUsers[0].email,
      ...data,
    };
    return res(ctx.json(newKey));
  }),

  rest.get(`${API_URL}/settings/webhooks`, (req, res, ctx) => {
    return res(ctx.json(mockWebhooks));
  }),

  rest.post(`${API_URL}/settings/webhooks`, async (req, res, ctx) => {
    const data = await req.json();
    const newWebhook = {
      id: "new",
      createdAt: new Date().toISOString(),
      createdBy: mockUsers[0].email,
      failureCount: 0,
      lastTriggered: null,
      ...data,
    };
    return res(ctx.json(newWebhook));
  }),

  rest.patch(`${API_URL}/settings/webhooks/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    const data = await req.json();
    const webhook = mockWebhooks.find((w) => w.id === id);
    if (!webhook) {
      return res(ctx.status(404));
    }
    return res(ctx.json({ ...webhook, ...data }));
  }),

  // Metrics endpoints
  rest.get(`${API_URL}/metrics/usage`, (req, res, ctx) => {
    return res(ctx.json(mockMetrics.usage));
  }),

  rest.get(`${API_URL}/metrics/requests`, (req, res, ctx) => {
    return res(ctx.json(mockMetrics.requests));
  }),

  // System logs endpoints
  rest.get(`${API_URL}/settings/logs`, (req, res, ctx) => {
    const searchParams = new URLSearchParams(req.url.search);
    const level = searchParams.get("level");
    const category = searchParams.get("category");

    let logs = mockSystemLogs;
    if (level) {
      logs = logs.filter((log) => log.level === level);
    }
    if (category) {
      logs = logs.filter((log) => log.category === category);
    }

    return res(
      ctx.json({
        logs,
        total: logs.length,
      })
    );
  }),

  // Fallback 404 handler
  rest.all("*", (req, res, ctx) => {
    console.error(`Unhandled ${req.method} request to ${req.url}`);
    return res(
      ctx.status(404),
      ctx.json({ message: "Endpoint not found in mock handlers" })
    );
  }),
];

// Helper function to add delay to responses
export const addDelay = (
  handlers: typeof rest[keyof typeof rest][],
  delayMs: number = 150
) => {
  return handlers.map((handler) => {
    return handler.delay(delayMs);
  });
};