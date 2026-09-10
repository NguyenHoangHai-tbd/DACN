export interface Citation {
  id: string;
  title: string;
  url?: string;
  type?: 'report' | 'policy' | 'inventory' | 'member';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  suggestedActions?: string[];
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}
