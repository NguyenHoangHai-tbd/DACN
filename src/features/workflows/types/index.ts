export interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  channels: string[];
  templateBody: string;
  isActive: boolean;
}

export interface WorkflowLog {
  id: string;
  ruleId: string;
  ruleName: string;
  recipientCount: number;
  status: 'Success' | 'Failed' | 'Partial';
  executedAt: string;
  errorMessage?: string;
}

export interface AiWorkflowSuggestion {
  suggestedContent: string;
  audienceAnalysis: string;
  duplicateWarning?: string;
  recommendedTime: string;
}
