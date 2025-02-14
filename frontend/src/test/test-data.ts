// User data
export const mockUsers = [
  {
    id: "1",
    name: "Test User",
    email: "test@example.com",
    role: "admin",
    createdAt: "2025-02-14T10:00:00Z",
  },
  {
    id: "2",
    name: "Regular User",
    email: "user@example.com",
    role: "user",
    createdAt: "2025-02-14T11:00:00Z",
  },
] as const;

// Group data
export const mockGroups = [
  {
    id: "1",
    name: "Test Group",
    description: "A test group",
    membersCount: 2,
    createdAt: "2025-02-14T10:00:00Z",
    updatedAt: "2025-02-14T10:00:00Z",
  },
  {
    id: "2",
    name: "Another Group",
    description: null,
    membersCount: 1,
    createdAt: "2025-02-14T11:00:00Z",
    updatedAt: "2025-02-14T11:00:00Z",
  },
] as const;

// Group members
export const mockGroupMembers = [
  {
    id: "1",
    userId: "1",
    role: "admin",
    addedAt: "2025-02-14T10:00:00Z",
    addedBy: "system",
  },
  {
    id: "2",
    userId: "2",
    role: "member",
    addedAt: "2025-02-14T11:00:00Z",
    addedBy: "user@example.com",
  },
] as const;

// API Keys
export const mockApiKeys = [
  {
    id: "1",
    name: "Test API Key",
    key: "test_key_1",
    createdAt: "2025-02-14T10:00:00Z",
    expiresAt: "2026-02-14T10:00:00Z",
    lastUsed: "2025-02-14T09:00:00Z",
    scopes: ["read", "write"],
    createdBy: "user@example.com",
  },
  {
    id: "2",
    name: "Read-only Key",
    key: "test_key_2",
    createdAt: "2025-02-14T11:00:00Z",
    expiresAt: null,
    lastUsed: null,
    scopes: ["read"],
    createdBy: "user@example.com",
  },
] as const;

// Webhooks
export const mockWebhooks = [
  {
    id: "1",
    name: "Test Webhook",
    url: "https://test.com/webhook",
    events: ["user.created", "user.updated"],
    active: true,
    createdAt: "2025-02-14T10:00:00Z",
    createdBy: "user@example.com",
    lastTriggered: "2025-02-14T09:00:00Z",
    failureCount: 0,
  },
  {
    id: "2",
    name: "Inactive Webhook",
    url: "https://test.com/webhook2",
    events: ["system.alert"],
    active: false,
    createdAt: "2025-02-14T11:00:00Z",
    createdBy: "user@example.com",
    lastTriggered: null,
    failureCount: 2,
  },
] as const;

// Metrics
export const mockMetrics = {
  usage: {
    total: 1000000,
    current: 750000,
    limit: 1000000,
    history: [
      { date: "2025-02-13", value: 50000 },
      { date: "2025-02-14", value: 75000 },
    ],
  },
  requests: {
    total: 5000,
    successful: 4800,
    failed: 200,
    history: [
      { date: "2025-02-13", success: 2400, failed: 100 },
      { date: "2025-02-14", success: 2400, failed: 100 },
    ],
  },
} as const;

// System Logs
export const mockSystemLogs = [
  {
    id: "1",
    timestamp: "2025-02-14T10:00:00Z",
    level: "info",
    category: "auth",
    message: "User logged in",
    details: { userId: "1", ip: "127.0.0.1" },
    user: "test@example.com",
  },
  {
    id: "2",
    timestamp: "2025-02-14T10:01:00Z",
    level: "error",
    category: "api",
    message: "Rate limit exceeded",
    details: { limit: 1000, current: 1001 },
    user: "user@example.com",
  },
] as const;

// Helper function to create test IDs
export const createTestId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to create test dates
export const createTestDate = (daysAgo: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};