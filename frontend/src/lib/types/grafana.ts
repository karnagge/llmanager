export interface GrafanaDashboard {
  dashboard: {
    id: number;
    uid: string;
    title: string;
    tags: string[];
    timezone: string;
    schemaVersion: number;
    version: number;
    panels: GrafanaPanel[];
  };
  meta: {
    isStarred: boolean;
    url: string;
    slug: string;
    type: string;
    version: number;
    created: string;
    updated: string;
    updatedBy: string;
    createdBy: string;
    folderId: number;
    folderTitle: string;
  };
}

export interface GrafanaPanel {
  id: number;
  title: string;
  type: string;
  datasource: string | { type: string; uid: string };
  targets: any[];
  gridPos: {
    h: number;
    w: number;
    x: number;
    y: number;
  };
}

export interface GrafanaDatasource {
  id: number;
  uid: string;
  orgId: number;
  name: string;
  type: string;
  typeName: string;
  url: string;
  access: string;
  basicAuth: boolean;
  isDefault: boolean;
  jsonData: Record<string, any>;
  readOnly: boolean;
}

export interface GrafanaHealthCheckResult {
  status: string;
  message: string;
  details?: Record<string, any>;
}

export interface GrafanaMetricsResponse {
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      values: [number, string][];
    }>;
  };
  status: string;
}