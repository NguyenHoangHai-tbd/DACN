import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { useAuthStore } from '../../auth/store/authStore';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TenantList } from '../components/TenantList';
import { UserList } from '../components/UserList';
import { MemberList } from '../../members/components/MemberList';
import { BookList } from '../../books/components/BookList';
import { SearchInterface } from '../../search/components/SearchInterface';
import { CirculationPanel } from '../../circulation/components/CirculationPanel';
import { ActiveLoans } from '../../circulation/components/ActiveLoans';
import { ReturnedUnpaidFines } from '../../circulation/components/ReturnedUnpaidFines';
import { ActiveHolds } from '../../circulation/components/ActiveHolds';
import { NotificationBadge } from '../../notifications/components/NotificationInbox';
import { TemplateManager } from '../../notifications/components/TemplateManager';
import { SignalRIndicator } from '../../../shared/signalr/components/SignalRIndicator';
import { BarcodeScanner } from '../../scanner/components/BarcodeScanner';
import { PrintManager } from '../../scanner/components/PrintManager';
import { DashboardOverview } from '../../dashboard/components/DashboardOverview';
import { AuditLogList } from '../../audit/components/AuditLogList';
import { TransferBoard } from '../../transfers/components/TransferBoard';
import { PolicyManager } from '../../policies/components/PolicyManager';
import { ReportBuilder } from '../../reports/components/ReportBuilder';
import { ImportExportManager } from '../../imports/components/ImportExportManager';
import { RecommendationCenter } from '../../recommendations/components/RecommendationCenter';
import { WorkflowManager } from '../../workflows/components/WorkflowManager';
import { IntegrationManager } from '../../integrations/components/IntegrationManager';
import { MonitoringDashboard } from '../../monitoring/components/MonitoringDashboard';
import { BrandingManager } from '../../branding/components/BrandingManager';
import { AiChatDrawer } from '../../ai-chat/components/AiChatDrawer';
import { usePermission } from '../../../shared/hooks/usePermission';
import { useRoleStore } from '../../../shared/store/roleStore';
import { MemberLoansView, MemberHoldsView, MemberProfileView } from '../../members/components/MemberPortalViews';
import { Building2, LogOut, Search, ArrowRightLeft, Users, GitBranch, Globe, BookOpen, MessageSquareText, ScanBarcode, Printer, Activity, Shield, ClipboardList, FileBarChart2, FileSpreadsheet, Sparkles, Zap, BrainCircuit, Bot, ScanLine, Plug, MonitorPlay, Palette, Clock, ShieldCheck, ShieldAlert, Menu, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, React.ComponentType<any>> = {
  Activity,
  Shield,
  Search,
  ScanBarcode,
  Printer,
  ArrowRightLeft,
  Users,
  GitBranch,
  Globe,
  BookOpen,
  MessageSquareText,
  ClipboardList,
  FileBarChart2,
  FileSpreadsheet,
  Zap,
  BrainCircuit,
  Bot,
  ScanLine,
  Plug,
  MonitorPlay,
  Palette,
  Clock,
  ShieldCheck,
  ShieldAlert
};

// 403 Page Forbidden Guard
const Forbidden403: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { t } = useTranslation();
  const getRoleConfig = useRoleStore((state) => state.getRoleConfig);
  const activeConfig = getRoleConfig();
  
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-lg mx-auto my-12 text-center shadow-xl animate-in fade-in duration-250">
      <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-6 shadow-sm">
        <ShieldAlert size={40} className="stroke-[1.8]" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">
          {t('role.unauthorized', 'Bạn không có quyền truy cập chức năng này')}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed px-2">
          {t('role.unauthorized_message', 'Tài khoản của bạn không có đủ quyền hạn để truy cập mục này. Vui lòng liên hệ quản trị viên nếu bạn cần cấp thêm quyền.')}
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
        <div className="flex justify-between text-xs text-slate-400 font-medium px-4">
          <span>Tab yêu cầu:</span>
          <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">{activeTab}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-medium px-4">
          <span>Quyền hiện tại:</span>
          <span className="font-semibold text-slate-700" style={{ color: activeConfig.color }}>
            {t(activeConfig.labelKey, activeConfig.defaultLabel)}
          </span>
        </div>
      </div>
    </div>
  );
};

const getTabDescription = (tab: string, defaultLabel: string, currentRole?: string): string => {
  if (currentRole === 'librarian' && tab === 'catalog') {
    return 'Tra cứu thông tin sách, số lượng còn lại và vị trí kệ sách';
  }
  const descMap: Record<string, string> = {
    dashboard: 'Theo dõi tổng quan hoạt động thư viện',
    tenants: 'Quản lý các thư viện/khu vực trong hệ thống',
    users: 'Quản lý tài khoản và phân quyền người dùng',
    audit: 'Theo dõi nhật ký hoạt động hệ thống',
    reports: 'Xem và xuất báo cáo hệ thống',
    catalog: 'Quản lý danh mục sách và tình trạng tồn kho',
    members: 'Quản lý thông tin độc giả và hạng thẻ',
    circulation: 'Quản lý mượn sách, trả sách và xử lý đặt giữ',
    policies: 'Cấu hình chính sách mượn trả và hạn mức phạt',
    transfers: 'Luân chuyển sách giữa các chi nhánh thư viện'
  };
  return descMap[tab] || (defaultLabel ? `Quản lý ${String(defaultLabel).toLowerCase()}` : 'Quản lý nghiệp vụ');
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, tenantCode, logout } = useAuthStore();
  const { i18n, t } = useTranslation();
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  
  const { currentRole, roleConfig, hasPermission } = usePermission();

  // Fetch tenants for Super Admin selector dynamically from API
  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: adminService.getTenants,
    retry: 1,
    staleTime: 30000,
  });

  const defaultTenants = [
    { code: 'hq', displayName: 'Hà Nội HQ (hq)' },
    { code: 'lib-hcm', displayName: 'TP.HCM (lib-hcm)' }
  ];

  const tenantsList = tenantsData && tenantsData.length > 0
    ? tenantsData.map(tenant => {
        let displayName = `${tenant.name} (${tenant.code})`;
        if (tenant.code === 'hq') {
          displayName = 'Hà Nội HQ (hq)';
        } else if (tenant.code === 'lib-hcm') {
          displayName = 'TP.HCM (lib-hcm)';
        }
        return { code: tenant.code, displayName };
      })
    : defaultTenants;

  const currentTenantObj = tenantsList.find(t => t.code === tenantCode);
  const displayTenantName = tenantCode === 'global'
    ? 'Hệ thống tổng'
    : (currentTenantObj 
        ? currentTenantObj.displayName.split(' (')[0] 
        : (tenantCode === 'hq' ? 'Hà Nội HQ' : tenantCode === 'lib-hcm' ? 'TP.HCM' : 'Toàn hệ thống'));

  const [activeTab, setActiveTab] = useState(() => {
    const deprecatedTabs = ['ai-admin', 'predictions', 'ocr', 'monitoring', 'integrations', 'branding', 'transfers', 'inventory'];
    const storedTab = localStorage.getItem('activeTab');
    if (storedTab && !deprecatedTabs.includes(storedTab)) {
      return storedTab;
    }
    return roleConfig.defaultPath;
  });

  useEffect(() => {
    setActiveTab(roleConfig.defaultPath);
  }, [currentRole, roleConfig.defaultPath]);

  // Backstop guard: if the current active tab is not allowed under the active role configuration, 
  // immediately redirect back to the default or first valid path to prevent non-ideal states.
  useEffect(() => {
    const deprecatedTabs = ['ai-admin', 'predictions', 'ocr', 'monitoring', 'integrations', 'branding', 'transfers', 'inventory'];
    const isAllowed = roleConfig.navItems.some(item => item.id === activeTab) && !deprecatedTabs.includes(activeTab);
    if (!isAllowed || deprecatedTabs.includes(activeTab)) {
      if (currentRole === 'librarian' && activeTab === 'search') {
        setActiveTab('catalog');
      } else {
        setActiveTab(roleConfig.defaultPath || roleConfig.navItems[0]?.id || 'dashboard');
      }
    }
  }, [activeTab, roleConfig, currentRole]);

  // Generate dynamic navigation items based on active role configuration
  const visibleMenuItems = roleConfig.navItems.map(item => {
    const IconComponent = iconMap[item.iconName] || BookOpen;
    return {
      id: item.id,
      icon: IconComponent,
      label: t(item.labelKey, item.defaultLabel)
    };
  });

  const getFallbackLabel = (tab: string): string => {
    const fallbackMap: Record<string, string> = {
      dashboard: 'Tổng quan',
      users: 'Quản lý tài khoản',
      catalog: 'Quản lý sách',
      members: 'Quản lý độc giả',
      circulation: 'Mượn / Trả sách',
      reports: 'Báo cáo',
      'ai-admin': 'AI gợi ý phân quyền',
    };
    return fallbackMap[tab] || tab.toUpperCase();
  };

  const activeItem = visibleMenuItems.find(i => i.id === activeTab) || {
    id: activeTab,
    label: t(`menu.${activeTab}`, getFallbackLabel(activeTab))
  };

  const isTabAllowed = roleConfig.navItems.some(item => item.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* 1. Full-Width Topbar Header */}
      <header className="bg-slate-950 border-b border-white/10 text-white h-16 w-full flex items-center justify-between px-5 sm:px-6 z-50 shrink-0 sticky top-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo TBD & Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="https://lms.tbd.edu.vn/pluginfile.php/1/theme_edumy/headerlogo1/1786323723/logo-TBD-white%20%282%29.png"
              alt="Logo TBD"
              className="h-8 object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="h-4 w-px bg-white/20 shrink-0" />
            <span className="text-teal-400 font-bold text-xs uppercase tracking-wider truncate">
              THƯ VIỆN SỐ
            </span>
          </div>

          {/* Read-only Role Badge */}
          <div className="hidden md:inline-flex items-center gap-2 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold px-3 py-1 rounded-full shadow-xs select-none shrink-0 ml-1">
            <span className="w-2 h-2 rounded-full shrink-0 shadow-xs bg-teal-400" />
            <span className="truncate font-semibold">
              {t(roleConfig.labelKey, roleConfig.defaultLabel)}
            </span>
          </div>
        </div>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-nowrap shrink-0">
          {/* Nút Cổng Thư Viện */}
          <button
            type="button"
            onClick={() => window.open('/landing', '_blank')}
            className="inline-flex items-center gap-1.5 text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0"
            title="Xem Cổng Thư Viện công khai"
          >
            <span>🌐</span>
            <span className="hidden sm:inline">Cổng Thư Viện</span>
            <ExternalLink size={13} className="text-slate-400" />
          </button>

          {/* Nút AI Hỗ Trợ */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAiChatOpen(true)} 
            className="gap-1.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 font-semibold text-xs h-9 px-3.5 rounded-xl transition-all hidden md:flex cursor-pointer"
          >
            <Sparkles size={15} className="text-teal-300" />
            <span>AI hỗ trợ</span>
          </Button>
          
          <div className="text-slate-300 hover:text-white [&_button]:hover:bg-white/10 [&_svg]:text-slate-300">
            <NotificationBadge />
          </div>

          {/* Lang Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 p-0.5 rounded-full text-slate-300 shrink-0">
            <button 
              onClick={() => i18n.changeLanguage('vi-VN')}
              className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs rounded-full transition-colors cursor-pointer ${i18n.language === 'vi-VN' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              VN
            </button>
            <button 
              onClick={() => i18n.changeLanguage('en-US')}
              className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs rounded-full transition-colors cursor-pointer ${i18n.language === 'en-US' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              EN
            </button>
          </div>
          
          {/* Nút Đăng Xuất */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => logout()} 
            className="text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-full h-9 w-9 cursor-pointer transition-colors"
            title={t('auth.logout', 'Đăng xuất')}
            aria-label="Đăng xuất"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      {/* 2. Horizontal Navbar Navigation */}
      <nav className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 overflow-x-auto py-2.5 hidden-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {visibleMenuItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`transition-all select-none text-left focus:outline-none cursor-pointer ${
                    isActive 
                      ? 'bg-teal-600 text-white font-bold rounded-xl shadow-xs px-3.5 py-2 text-xs sm:text-sm flex items-center gap-2 shrink-0' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0'
                  }`}
                >
                  <item.icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Scope/Tenant Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl shrink-0">
            <Building2 size={14} className="text-teal-600 shrink-0" />
            <span className="text-xs text-slate-500 font-medium">Phạm vi:</span>
            <span className="text-xs text-slate-800 font-bold truncate max-w-[180px]">{displayTenantName}</span>
          </div>
        </div>
      </nav>

      {/* 3. Main Content Pane */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative pb-10">
          {/* Inner View Components with 403 Gating */}
          {!isTabAllowed && <Forbidden403 activeTab={activeTab} />}

          {isTabAllowed && activeTab === 'dashboard' && <div className="animate-in fade-in zoom-in-95 duration-300"><DashboardOverview /></div>}
          {isTabAllowed && activeTab === 'audit' && <div className="animate-in fade-in zoom-in-95 duration-300"><AuditLogList /></div>}
          {isTabAllowed && activeTab === 'reports' && <div className="animate-in fade-in zoom-in-95 duration-300"><ReportBuilder /></div>}
          {isTabAllowed && activeTab === 'policies' && <div className="animate-in fade-in zoom-in-95 duration-300"><PolicyManager /></div>}
          {isTabAllowed && activeTab === 'transfers' && <div className="animate-in fade-in zoom-in-95 duration-300"><TransferBoard /></div>}
          {isTabAllowed && activeTab === 'imports' && <div className="animate-in fade-in zoom-in-95 duration-300"><ImportExportManager /></div>}
          {isTabAllowed && activeTab === 'workflows' && <div className="animate-in fade-in zoom-in-95 duration-300"><WorkflowManager /></div>}
          {isTabAllowed && activeTab === 'integrations' && <div className="animate-in fade-in zoom-in-95 duration-300"><IntegrationManager /></div>}
          {isTabAllowed && activeTab === 'monitoring' && <div className="animate-in fade-in zoom-in-95 duration-300"><MonitoringDashboard /></div>}
          {isTabAllowed && activeTab === 'recommendations' && <div className="animate-in fade-in zoom-in-95 duration-300"><RecommendationCenter /></div>}
          {isTabAllowed && activeTab === 'branding' && <div className="animate-in fade-in zoom-in-95 duration-300"><BrandingManager /></div>}
          {isTabAllowed && activeTab === 'search' && <div className="animate-in fade-in zoom-in-95 duration-300"><SearchInterface /></div>}
          {isTabAllowed && activeTab === 'scanner' && <div className="animate-in fade-in zoom-in-95 duration-300"><BarcodeScanner /></div>}
          {isTabAllowed && activeTab === 'print_codes' && <div className="animate-in fade-in zoom-in-95 duration-300"><PrintManager /></div>}
          {isTabAllowed && activeTab === 'circulation' && (
            <div className="flex flex-col gap-6 w-full transition-all">
              <CirculationPanel />
              <ActiveLoans />
              <ReturnedUnpaidFines />
              <ActiveHolds />
            </div>
          )}
          {isTabAllowed && activeTab === 'catalog' && <BookList />}
          {isTabAllowed && activeTab === 'members' && <MemberList />}
          {isTabAllowed && activeTab === 'tenants' && <TenantList />}
          {isTabAllowed && activeTab === 'users' && <UserList />}

          {isTabAllowed && activeTab === 'templates' && <TemplateManager />}

          {/* Member Portal Custom Sections */}
          {isTabAllowed && activeTab === 'my-loans' && <div className="animate-in fade-in duration-300"><MemberLoansView /></div>}
          {isTabAllowed && activeTab === 'my-holds' && <div className="animate-in fade-in duration-300"><MemberHoldsView /></div>}
          {isTabAllowed && activeTab === 'profile' && <div className="animate-in fade-in duration-300"><MemberProfileView /></div>}
        </div>
      </main>

      {/* 4. Footer chuẩn TBD */}
      <footer className="bg-slate-950 text-white border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Thư Viện Số - Trường Đại học Thái Bình Dương (TBD)</p>
          <p>Cổng Thông Tin Học Liệu & Quản Trị Thư Viện Đồng Nhất</p>
        </div>
      </footer>

      {/* AI Chat Drawer */}
      <AiChatDrawer isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} />
    </div>
  );
};
