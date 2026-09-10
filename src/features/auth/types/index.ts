export interface UserProfile {
  id: string;
  username: string;
  tenantId: string;
  roles: string[];
  branchIds: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  riskAlert?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  errors: Array<{ field: string, code: string }> | null;
  meta: any;
}
