export interface Integration {
  id: string;
  name: string;
  provider: string; // e.g., 'auth0', 'azure_ad', 'twilio', 'sendgrid'
  type: 'SSO' | 'SMS' | 'Email';
  status: 'Active' | 'Inactive' | 'Error';
  config: Record<string, string>;
}

export interface ApiKey {
  id: string;
  name: string;
  keyHint: string;
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

export interface WebhookConfig {
  id: string;
  name: string;
  endpoint: string;
  events: string[];
  secret?: string;
  isActive: boolean;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  url: string;
  event: string;
  httpStatus: number;
  timestamp: string;
  responseBody: string;
  requestPayload: string;
}

export interface AiLogAnalysis {
  cause: string;
  recommendation: string;
}
