export interface Tenant {
  id: string;
  code: string;
  name: string;
  status: string;
  createdAt: string;
  totalBooks?: number;
  totalMembers?: number;
  activeLoans?: number;
  overdueLoans?: number;
  tenantAdmin?: string;
  librarian?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  tenantId: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  status: 'Active' | 'Inactive';
  tenantId: string;
  createdAt: string;
}

export interface AiRoleSuggestionRequest {
  libraryType: string;
}

export interface AiRoleSuggestionResponse {
  suggestion: string;
  roles: string[];
}
