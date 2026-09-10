import { useRoleStore } from '../store/roleStore';

export function usePermission() {
  const currentRole = useRoleStore((state) => state.currentRole);
  const getRoleConfig = useRoleStore((state) => state.getRoleConfig);
  const hasPermission = useRoleStore((state) => state.hasPermission);
  
  return {
    currentRole,
    roleConfig: getRoleConfig(),
    hasPermission,
    isSuperAdmin: currentRole === 'super_admin',
    isTenantAdmin: currentRole === 'tenant_admin',
    isLibrarian: currentRole === 'librarian',
    isMember: currentRole === 'member',
  };
}
