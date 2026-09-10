export interface AuditLog {
  id: string;
  actor: string;
  action: 'Create' | 'Update' | 'Delete' | 'Login' | 'Export' | 'Other';
  entity: string;
  entityId: string;
  tenantId: string;
  ipAddress: string;
  timestamp: string;
  details: string;
  isAnomalous?: boolean;
}

export interface AuditLogDetail extends AuditLog {
  oldValues?: any;
  newValues?: any;
  userAgent?: string;
  correlationId?: string;
}

export interface AuditInsight {
  summary: string;
  anomaliesIdentified: string[];
  suggestedActions: string[];
}
