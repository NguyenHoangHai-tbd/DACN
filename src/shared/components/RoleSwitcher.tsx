import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check, ShieldAlert } from 'lucide-react';
import { useRoleStore, ROLE_CONFIGS } from '../store/roleStore';
import { useAuthStore } from '../../features/auth/store/authStore';

export const RoleSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const isAuthenticated = useAuthStore(state => !!state.accessToken);
  const { currentRole, setRole, getRoleConfig } = useRoleStore();
  const activeConfig = getRoleConfig();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isAuthenticated) {
    return null;
  }

  const handleRoleSelect = (roleId: string) => {
    setRole(roleId);
    
    // Synchronize auth user context with mock profiles dynamically for full fidelity
    const authStore = useAuthStore.getState();
    if (authStore) {
      let simulatedUser = { ...authStore.user };
      if (roleId === 'super_admin') {
        simulatedUser = {
          id: 'u-1',
          username: 'Super Admin Demo',
          tenantId: 'tenant-1',
          roles: ['SuperAdmin'],
          branchIds: ['branch-center'],
        };
      } else if (roleId === 'tenant_admin') {
        simulatedUser = {
          id: 'u-1',
          username: 'Admin thư viện HQ',
          tenantId: 'tenant-1',
          roles: ['TenantAdmin'],
          branchIds: ['branch-center'],
        };
      } else if (roleId === 'librarian') {
        simulatedUser = {
          id: 'u-librarian',
          username: 'Thủ thư Demo',
          tenantId: 'tenant-1',
          roles: ['Librarian'],
          branchIds: ['branch-center'],
        };
      } else if (roleId === 'member') {
        simulatedUser = {
          id: 'u-member-U002',
          username: 'Độc giả Demo',
          tenantId: 'tenant-1',
          roles: ['Member'],
          branchIds: ['branch-center'],
        };
      }
      useAuthStore.setState({ user: simulatedUser });
    }

    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="role-switcher-container">
      <div className="flex items-center gap-1">
        <span className="hidden lg:inline text-xs font-medium text-slate-400 mr-1.5 uppercase tracking-wider whitespace-nowrap">
          {t('role.login_as', 'Xem thử giao diện theo vai trò')}:
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 active:scale-95"
          id="role-switcher-button"
        >
          {/* Badge Color Bullet */}
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: activeConfig.color }}
          />
          <span className="max-w-[130px] sm:max-w-none truncate text-slate-800">
            {t(activeConfig.labelKey, activeConfig.defaultLabel)}
          </span>
          <ChevronDown size={14} className={`text-slate-500 transition-transform duration-250 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute left-0 lg:left-auto lg:right-0 z-50 mt-2 w-64 origin-top-left lg:origin-top-right rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-3 duration-200"
          id="role-switcher-dropdown"
        >
          <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert size={12} className="text-amber-500" /> CHẾ ĐỘ DEMO PHÂN QUYỀN
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
              Chọn vai trò để xem giao diện theo từng quyền.
            </p>
          </div>
          <div className="space-y-0.5 max-h-[320px] overflow-y-auto">
            {Object.values(ROLE_CONFIGS).map((config) => {
              const isSelected = config.id === currentRole;
              return (
                <button
                  key={config.id}
                  onClick={() => handleRoleSelect(config.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-50/65 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full border border-black/5"
                      style={{ backgroundColor: config.color }}
                    />
                    <span>{t(config.labelKey, config.defaultLabel)}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-blue-600 shrink-0 font-bold" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default RoleSwitcher;
