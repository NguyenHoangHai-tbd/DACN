import { create } from 'zustand';

export interface NavItem {
  id: string;
  iconName: string; // e.g. 'Activity', 'Shield', 'Search'
  labelKey: string;
  defaultLabel: string;
}

export interface RoleConfig {
  id: string;
  labelKey: string;
  defaultLabel: string;
  color: string;
  defaultPath: string; // default active tab ID
  navItems: NavItem[];
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  super_admin: {
    id: 'super_admin',
    labelKey: 'role.super_admin',
    defaultLabel: 'Super Admin - Quản trị hệ thống',
    color: '#0d9488',
    defaultPath: 'dashboard',
    navItems: [
      { id: 'dashboard', iconName: 'Activity', labelKey: 'menu.dashboard', defaultLabel: 'Tổng quan' },
      { id: 'tenants', iconName: 'Globe', labelKey: 'menu.tenants', defaultLabel: 'Quản lý thư viện' },
      { id: 'users', iconName: 'Users', labelKey: 'menu.users', defaultLabel: 'Quản lý tài khoản' },
      { id: 'audit', iconName: 'Shield', labelKey: 'menu.audit', defaultLabel: 'Nhật ký hệ thống' },
      { id: 'reports', iconName: 'FileBarChart2', labelKey: 'menu.reports', defaultLabel: 'Báo cáo' },
    ],
  },
  tenant_admin: {
    id: 'tenant_admin',
    labelKey: 'role.tenant_admin',
    defaultLabel: 'Tenant Admin - Admin thư viện',
    color: '#185FA5',
    defaultPath: 'dashboard',
    navItems: [
      { id: 'dashboard', iconName: 'Activity', labelKey: 'menu.dashboard', defaultLabel: 'Tổng quan' },
      { id: 'users', iconName: 'Users', labelKey: 'menu.users', defaultLabel: 'Quản lý tài khoản' },
      { id: 'catalog', iconName: 'BookOpen', labelKey: 'menu.catalog_manage', defaultLabel: 'Quản lý sách' },
      { id: 'members', iconName: 'Users', labelKey: 'menu.members', defaultLabel: 'Quản lý độc giả' },
      { id: 'circulation', iconName: 'ArrowRightLeft', labelKey: 'circulation.title', defaultLabel: 'Mượn / Trả sách' },
      { id: 'reports', iconName: 'FileBarChart2', labelKey: 'menu.reports', defaultLabel: 'Báo cáo' },
      { id: 'policies', iconName: 'BookOpen', labelKey: 'menu.policies', defaultLabel: 'Chính sách mượn / phạt' },
      { id: 'workflows', iconName: 'Zap', labelKey: 'menu.workflows', defaultLabel: 'Thông báo / Quy trình' },
    ],
  },
  librarian: {
    id: 'librarian',
    labelKey: 'role.librarian',
    defaultLabel: 'Librarian - Thủ thư',
    color: '#0F6E56',
    defaultPath: 'circulation',
    navItems: [
      { id: 'dashboard', iconName: 'Activity', labelKey: 'menu.dashboard', defaultLabel: 'Tổng quan' },
      { id: 'catalog', iconName: 'BookOpen', labelKey: 'menu.catalog_view', defaultLabel: 'Danh mục sách' },
      { id: 'members', iconName: 'Users', labelKey: 'menu.members', defaultLabel: 'Quản lý độc giả' },
      { id: 'circulation', iconName: 'ArrowRightLeft', labelKey: 'circulation.title', defaultLabel: 'Mượn / Trả sách' },
      { id: 'workflows', iconName: 'Zap', labelKey: 'menu.workflows', defaultLabel: 'Thông báo / Quy trình' },
    ],
  },
  member: {
    id: 'member',
    labelKey: 'role.member',
    defaultLabel: 'Member - Độc giả',
    color: '#993C1D',
    defaultPath: 'search',
    navItems: [
      { id: 'search', iconName: 'Search', labelKey: 'menu.search', defaultLabel: 'Tìm kiếm sách' },
      { id: 'my-loans', iconName: 'BookOpen', labelKey: 'role.sidebar.my_loans', defaultLabel: 'Sách đang mượn' },
      { id: 'my-holds', iconName: 'Clock', labelKey: 'role.sidebar.my_holds', defaultLabel: 'Đặt giữ của tôi' },
      { id: 'profile', iconName: 'Users', labelKey: 'role.sidebar.profile', defaultLabel: 'Hồ sơ & thẻ thư viện' },
      { id: 'recommendations', iconName: 'Bot', labelKey: 'menu.recommendations', defaultLabel: 'Gợi ý sách' },
    ],
  },
};

const PERMISSIONS_MAP: Record<string, string[]> = {
  super_admin: ['*'],
  tenant_admin: [
    'user.manage',
    'branch.manage',
    'catalog.manage',
    'reader.manage',
    'loan.manage',
    'hold.manage',
    'report.view',
    'report.export',
    'policy.manage',
    'import.manage',
    'notification.manage',
    'workflow.manage',
    'audit.view',
    'ai.admin',
    'ai.chat',
  ],
  librarian: [
    'catalog.view',
    'reader.view',
    'reader.manage',
    'loan.manage',
    'hold.manage',
    'report.view',
    'notification.view',
    'book.search',
    'ai.chat',
  ],
  member: [
    'book.search',
    'loan.view.own',
    'hold.own',
    'profile.own',
    'notification.own',
    'ai.chat',
  ],
};

interface RoleStore {
  currentRole: string;
  setRole: (role: string) => void;
  getRoleConfig: () => RoleConfig;
  hasPermission: (permission: string) => boolean;
}

export const useRoleStore = create<RoleStore>((set, get) => ({
  currentRole: (() => {
    try {
      const authSaved = localStorage.getItem('auth-storage');
      if (authSaved) {
        const parsed = JSON.parse(authSaved);
        const user = parsed?.state?.user;
        const apiRole = user?.roles?.[0] || user?.role;
        if (apiRole) {
          if (apiRole === 'SuperAdmin') return 'super_admin';
          if (apiRole === 'TenantAdmin') return 'tenant_admin';
          if (apiRole === 'Librarian') return 'librarian';
          if (apiRole === 'Member') return 'member';
        }
      }
    } catch (e) {
      // Ignore
    }

    const saved = localStorage.getItem('currentRole');
    if (saved === 'it_admin' || saved === 'inventory_staff') {
      localStorage.setItem('currentRole', 'tenant_admin');
      return 'tenant_admin';
    }
    if (saved && ROLE_CONFIGS[saved]) {
      return saved;
    }
    return 'tenant_admin'; // Default fallback
  })(),
  
  setRole: (role: string) => {
    if (ROLE_CONFIGS[role]) {
      localStorage.setItem('currentRole', role);
      set({ currentRole: role });
    }
  },

  getRoleConfig: () => {
    const { currentRole } = get();
    return ROLE_CONFIGS[currentRole] || ROLE_CONFIGS.tenant_admin;
  },

  hasPermission: (permission: string) => {
    const { currentRole } = get();
    const userPermissions = PERMISSIONS_MAP[currentRole] || [];
    if (userPermissions.includes('*')) {
      return true;
    }
    return userPermissions.includes(permission);
  },
}));
