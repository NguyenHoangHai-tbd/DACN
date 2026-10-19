import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { ReportDataset, ReportFilter, ReportPreview, ReportAiInsight } from '../types';

const requestFilters = (filters: ReportFilter) => ({
  ...filters,
  branchId: filters.branchId === 'all' ? null : filters.branchId,
});

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const escapeCsv = (value: unknown) => {
  const text = String(value ?? '');
  const safe = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const reportService = {
  getDatasets: async (): Promise<ReportDataset[]> => {
    const res = await axiosInstance.get<ApiResponse<ReportDataset[]>>('/reports/datasets');
    return res.data.data;
  },

  runReport: async (datasetId: string, filters: ReportFilter): Promise<ReportPreview> => {
    const res = await axiosInstance.post<ApiResponse<ReportPreview>>('/reports/run', { datasetId, filters: requestFilters(filters) });
    return res.data.data;
  },

  exportReport: async (datasetId: string, filters: ReportFilter, format: 'excel' | 'pdf' | 'csv'): Promise<{ url: string; fileName: string; printable: boolean }> => {
    const report = await reportService.runReport(datasetId, filters);
    const date = new Date().toISOString().slice(0, 10);
    if (format === 'pdf') {
      const head = report.columns.map(column => `<th>${escapeHtml(column)}</th>`).join('');
      const body = report.rows.map(row => `<tr>${report.columns.map(column => `<td>${escapeHtml(row[column])}</td>`).join('')}</tr>`).join('');
      const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Báo cáo thư viện</title><style>body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#f1f5f9}</style><h1>Báo cáo thư viện</h1><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><script>window.onload=()=>window.print()</script></html>`;
      return { url: URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })), fileName: `bao-cao-${datasetId}-${date}.html`, printable: true };
    }
    const separator = format === 'excel' ? '\t' : ',';
    const lines = [report.columns.map(escapeCsv).join(separator), ...report.rows.map(row => report.columns.map(column => escapeCsv(row[column])).join(separator))];
    const extension = format === 'excel' ? 'xls' : 'csv';
    const mime = format === 'excel' ? 'application/vnd.ms-excel;charset=utf-8' : 'text/csv;charset=utf-8';
    return {
      url: URL.createObjectURL(new Blob([`\ufeff${lines.join('\r\n')}`], { type: mime })),
      fileName: `bao-cao-${datasetId}-${date}.${extension}`,
      printable: false,
    };
  },

  getReportInsights: async (datasetId: string, filters: ReportFilter): Promise<ReportAiInsight> => {
    const res = await axiosInstance.post<ApiResponse<ReportAiInsight>>('/ai/report-insights', { datasetId, filters: requestFilters(filters) });
    return res.data.data;
  }
};
