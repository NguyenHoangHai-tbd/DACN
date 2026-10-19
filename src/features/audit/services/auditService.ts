import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { AuditLog, AuditLogDetail, AuditInsight } from '../types';

type BackendAuditLog = {
  id: string;
  actorName?: string;
  action?: string;
  entityName?: string;
  entityId?: string | null;
  summary?: string;
  createdAt?: string;
  tenantId?: string;
  ipAddress?: string;
  details?: string;
  oldValues?: unknown;
  newValues?: unknown;
  userAgent?: string;
  correlationId?: string;
};

type AuditFilters = { startDate?: string; endDate?: string; entity?: string; action?: string; search?: string };

const normalizeAction = (action: string): AuditLog['action'] => {
  const value = action.toLowerCase();
  if (value.includes('created') || value.includes('create')) return 'Create';
  if (value.includes('updated') || value.includes('update')) return 'Update';
  if (value.includes('deleted') || value.includes('delete')) return 'Delete';
  if (value.includes('login')) return 'Login';
  if (value.includes('export')) return 'Export';
  return 'Other';
};

const normalizeEntity = (entity: string): string => {
  if (entity === 'UserAccount') return 'User';
  if (entity === 'MemberProfile') return 'Member';
  if (entity === 'BookCopy') return 'Book';
  if (entity === 'LibraryPolicy') return 'Policy';
  return entity || 'System';
};

const normalizeLog = (log: BackendAuditLog): AuditLogDetail => ({
  id: log.id,
  actor: log.actorName || 'Hệ thống',
  action: normalizeAction(log.action || ''),
  entity: normalizeEntity(log.entityName || ''),
  entityId: log.entityId || '',
  tenantId: log.tenantId || '',
  ipAddress: log.ipAddress || 'Không ghi nhận',
  timestamp: log.createdAt || '',
  details: log.details || log.summary || log.action || 'Không có mô tả',
  oldValues: log.oldValues,
  newValues: log.newValues,
  userAgent: log.userAgent,
  correlationId: log.correlationId,
  isAnomalous: /failed|forbidden|unauthorized/i.test(`${log.action} ${log.summary}`),
});

const escapeCsv = (value: unknown): string => {
  const raw = String(value ?? '');
  const safe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const auditService = {
  getLogs: async (params?: AuditFilters): Promise<AuditLog[]> => {
    const res = await axiosInstance.get<ApiResponse<BackendAuditLog[]>>('/audit-logs');
    const logs = (res.data.data ?? []).map(normalizeLog);
    const search = params?.search?.trim().toLowerCase();
    return logs.filter(log =>
      (!search || `${log.actor} ${log.details} ${log.entity} ${log.action} ${log.ipAddress}`.toLowerCase().includes(search)) &&
      (!params?.entity || params.entity === 'all' || log.entity === params.entity) &&
      (!params?.action || params.action === 'all' || log.action === params.action) &&
      (!params?.startDate || log.timestamp >= params.startDate) &&
      (!params?.endDate || log.timestamp.slice(0, 10) <= params.endDate));
  },
  getLogDetail: async (id: string): Promise<AuditLogDetail> => {
    const logs = await auditService.getLogs();
    const log = logs.find(item => item.id === id);
    if (!log) throw new Error('Không tìm thấy bản ghi nhật ký.');
    return log;
  },
  exportLogs: async (params?: AuditFilters): Promise<{ url: string; fileName: string }> => {
    const logs = await auditService.getLogs(params);
    const columns: Array<keyof AuditLog> = ['timestamp', 'actor', 'action', 'entity', 'entityId', 'ipAddress', 'details'];
    const csv = `\ufeff${[columns.join(','), ...logs.map(log => columns.map(column => escapeCsv(log[column])).join(','))].join('\r\n')}`;
    return {
      url: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
      fileName: `nhat-ky-he-thong-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  },
  getAiInsight: async (params?: AuditFilters): Promise<AuditInsight> => {
    const logs = await auditService.getLogs(params);
    const anomalies = logs.filter(log => log.isAnomalous);
    return {
      summary: `Đã phân tích ${logs.length} sự kiện; phát hiện ${anomalies.length} sự kiện cần chú ý.`,
      anomaliesIdentified: anomalies.slice(0, 5).map(log => `${log.action} ${log.entity}: ${log.details}`),
      suggestedActions: anomalies.length
        ? ['Kiểm tra chi tiết các sự kiện được đánh dấu và xác minh tài khoản thực hiện.']
        : ['Chưa có dấu hiệu bất thường; tiếp tục theo dõi định kỳ.'],
    };
  },
};
