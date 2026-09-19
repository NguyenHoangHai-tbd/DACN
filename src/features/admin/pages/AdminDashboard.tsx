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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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
    setIsMobileSidebarOpen(false);
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
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Left Sidebar Scrim Backdrop for Mobile */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-[270px] bg-slate-950 text-slate-300 border-r border-slate-800/80 flex flex-col shrink-0 z-50 lg:z-30 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo & Header */}
        <div className="h-20 flex items-center justify-between px-5 shrink-0 relative z-10 border-b border-slate-800/80">
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
          
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Context / Scope */}
        <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-900/40">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Phạm vi hoạt động</p>
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 size={13} className="text-teal-400 shrink-0" />
            <p className="text-xs text-teal-300 font-semibold truncate">{displayTenantName}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 hidden-scrollbar" aria-label="Menu chức năng">
          {visibleMenuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-150 select-none text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 cursor-pointer ${
                  isActive 
                    ? 'bg-teal-600 text-white font-bold rounded-2xl shadow-md shadow-teal-900/30 border border-teal-500/30' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 rounded-2xl'
                }`}
              >
                <item.icon size={17} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Bottom User Area */}
        <div className="p-3 shrink-0 relative z-10 border-t border-slate-800/80 bg-slate-900/30">
          <div className="rounded-2xl p-2.5 flex items-center gap-3 bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs bg-teal-600">
              {user?.username.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.username || 'Quản trị viên'}</p>
              <p className="text-[10px] text-teal-400 font-medium truncate mt-0.5">{roleConfig.defaultLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 shrink-0 lg:pl-8 z-10">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Hamburger Mobile Menu Toggle Button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-xl -ml-2 transition-colors cursor-pointer shrink-0"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>

            {/* Current Page Title & Role Badge */}
            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {activeItem?.label || 'Bảng điều khiển'}
              </h1>

              {/* Read-only Role Badge */}
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border border-slate-200 bg-slate-50 text-slate-700 shadow-xs select-none shrink-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: roleConfig.color }}
                />
                <span className="truncate text-slate-800">
                  {t(roleConfig.labelKey, roleConfig.defaultLabel)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-nowrap shrink-0">
            {/* Nút Cổng Thư Viện */}
            <button
              type="button"
              onClick={() => window.open('/landing', '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 hover:bg-teal-50/60 rounded-xl border border-slate-200/80 transition-colors cursor-pointer shrink-0"
              title="Xem Cổng Thư Viện công khai"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">Cổng Thư Viện</span>
              <ExternalLink size={13} className="text-slate-400" />
            </button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAiChatOpen(true)} 
              className="gap-1.5 bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 rounded-xl hidden md:flex font-semibold text-xs h-9 px-3 transition-colors cursor-pointer"
            >
              <Sparkles size={15} className="text-teal-600" />
              <span>AI hỗ trợ</span>
            </Button>
            <NotificationBadge />

            {/* Lang Toggle */}
            <div className="flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200/80 shrink-0">
              <button 
                onClick={() => i18n.changeLanguage('vi-VN')}
                className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-full transition-colors cursor-pointer ${i18n.language === 'vi-VN' ? 'bg-white shadow-xs text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                VN
              </button>
              <button 
                onClick={() => i18n.changeLanguage('en-US')}
                className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-full transition-colors cursor-pointer ${i18n.language === 'en-US' ? 'bg-white shadow-xs text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                EN
              </button>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => logout()} 
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full h-9 w-9 cursor-pointer transition-colors"
              title={t('auth.logout', 'Đăng xuất')}
              aria-label="Đăng xuất"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </header>

        {/* Dynamic Main Content Pane */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100/80 p-4 sm:p-6 md:p-8 pb-16 relative">
           <div className="flex flex-col max-w-[1400px] mx-auto w-full min-h-full">
             <div className="flex-1 relative pb-10">
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
             
           </div>
        </main>
      </div>


       
       {/* AI Chat Drawer */}
       <AiChatDrawer isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} />
    </div>
  );
};
