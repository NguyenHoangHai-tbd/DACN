export interface Member {
  id: string;
  memberCode: string;
  fullName: string;
  email: string;
  phone: string;
  memberType: 'Student' | 'Teacher' | 'Staff' | 'External';
  status: 'Active' | 'Inactive' | 'Suspended';
  joinDate: string;
  expiryDate: string;
  tenantId?: string;
  branchId?: string;
  username?: string;
  cardNumber?: string;
  libraryCardNumber?: string;
}

export interface MemberHistory {
  id: string;
  memberId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface MemberInsight {
  segment: string;
  readingHabits: string[];
  recommendedPolicies: string;
  suggestedBooks: string[];
}
