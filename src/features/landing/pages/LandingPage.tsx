import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowRight,
  User,
  Search,
  Clock,
  MapPin,
  Sparkles,
  BookMarked,
  ShieldCheck,
  Phone,
  Mail,
  GraduationCap,
  Laptop,
  Library,
  Calendar,
  ChevronRight,
  Menu,
  X,
  Info,
  QrCode,
  Headphones,
  Users,
  Play,
  LogOut,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { NotificationBadge } from '../../notifications/components/NotificationInbox';
import { useAuthStore } from '../../auth/store/authStore';
import { usePermission } from '../../../shared/hooks/usePermission';
import { DashboardOverview } from '../../dashboard/components/DashboardOverview';
import { BookList } from '../../books/components/BookList';
import { MemberList } from '../../members/components/MemberList';
import { CirculationPanel } from '../../circulation/components/CirculationPanel';
import { ActiveLoans } from '../../circulation/components/ActiveLoans';
import { ReturnedUnpaidFines } from '../../circulation/components/ReturnedUnpaidFines';
import { ActiveHolds } from '../../circulation/components/ActiveHolds';
import { UserList } from '../../admin/components/UserList';
import { TenantList } from '../../admin/components/TenantList';
import { AuditLogList } from '../../audit/components/AuditLogList';
import { ReportBuilder } from '../../reports/components/ReportBuilder';
import { SearchInterface } from '../../search/components/SearchInterface';
import { MemberLoansView, MemberHoldsView, MemberProfileView } from '../../members/components/MemberPortalViews';
import { PolicyManager } from '../../policies/components/PolicyManager';
import { WorkflowManager } from '../../workflows/components/WorkflowManager';
import { BarcodeScanner } from '../../scanner/components/BarcodeScanner';
import { PrintManager } from '../../scanner/components/PrintManager';
import { TransferBoard } from '../../transfers/components/TransferBoard';
import { ImportExportManager } from '../../imports/components/ImportExportManager';
import { IntegrationManager } from '../../integrations/components/IntegrationManager';
import { MonitoringDashboard } from '../../monitoring/components/MonitoringDashboard';
import { RecommendationCenter } from '../../recommendations/components/RecommendationCenter';
import { BrandingManager } from '../../branding/components/BrandingManager';
import { TemplateManager } from '../../notifications/components/TemplateManager';

const HERO_IMAGES = [
  'https://lms.tbd.edu.vn/pluginfile.php/27963/block_cocoon_slider_8/slides/1/httpstbd.edu.vnwp-contentuploads202008TBD-m%25E1%25BB%259Bi-1.jpg',
  'https://lms.tbd.edu.vn/pluginfile.php/27963/block_cocoon_slider_8/slides/2/206164062_1707959246044526_2964929297492749281_n.jpg',
  'https://lms.tbd.edu.vn/pluginfile.php/27965/block_cocoon_about_1/content/diem-chuan-hoc-ba-dai-hoc-thai-binh-duong-tbd-2023-1-1683860676.jpg',
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user, tenantCode, logout, isAuthenticated } = useAuthStore();
  const { roleConfig } = usePermission();
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchNotice, setShowSearchNotice] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const SHORT_LABELS: Record<string, string> = {
    users: 'Tài khoản',
    catalog: 'Sách',
    members: 'Độc giả',
    circulation: 'Mượn - Trả',
    policies: 'Chính sách',
    workflows: 'Quy trình',
    tenants: 'Thư viện',
    audit: 'Nhật ký',
    profile: 'Hồ sơ',
    'my-loans': 'Đang mượn',
    'my-holds': 'Đặt giữ',
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchNotice(true);
    toast.info('Vui lòng đăng nhập hệ thống để tra cứu đầy đủ và đặt mượn sách!', {
      action: {
        label: 'Đăng nhập',
        onClick: () => navigate('/login'),
      },
      duration: 6000,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-600 selection:text-white hidden-scrollbar overflow-x-hidden">
      {/* 1. SINGLE-TIER TOPBAR / HEADER */}
      <header className="sticky top-0 z-50 h-16 bg-slate-950/95 backdrop-blur-md border-b border-white/10 text-white flex items-center px-3 sm:px-6 lg:px-8 shadow-sm">
        <div className="w-full flex items-center justify-between gap-2 lg:gap-4">
          {/* Bên trái: Logo TBD và khối menu điều hướng nằm cạnh nhau */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            {/* Logo TBD, vạch ngăn mỏng, chữ THƯ VIỆN SỐ */}
            <div 
              onClick={() => {
                setActiveTab('home');
                scrollToSection('hero');
              }}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
            >
              <img
                src="https://lms.tbd.edu.vn/pluginfile.php/1/theme_edumy/headerlogo1/1786323723/logo-TBD-white%20%282%29.png"
                alt="Đại học Thái Bình Dương"
                className="h-7 sm:h-8 lg:h-9 object-contain group-hover:opacity-90 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <div className="h-4 sm:h-5 w-px bg-white/20" />
              <span className="text-xs sm:text-sm font-bold tracking-wider text-teal-400 uppercase select-none whitespace-nowrap">
                THƯ VIỆN SỐ
              </span>
            </div>

            {/* Dãy tab điều hướng nằm ngay cạnh Logo TBD */}
            <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto hidden-scrollbar py-1">
              {/* Nút Trang chủ - LUÔN LUÔN HIỂN THỊ ĐẦU TIÊN CẠNH LOGO */}
              <button
                onClick={() => {
                  setActiveTab('home');
                  scrollToSection('hero');
                }}
                className={`transition-colors select-none text-left focus:outline-none cursor-pointer shrink-0 whitespace-nowrap font-medium text-xs px-2 sm:px-2.5 py-1 rounded-lg ${
                  activeTab === 'home'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                title="Trang chủ"
              >
                Trang chủ
              </button>

              {/* Các tab chức năng theo vai trò với tên rút gọn chống gãy dòng - chỉ hiện khi isAuthenticated() */}
              {isAuthenticated() &&
                roleConfig?.navItems?.map((item) => {
                  const isActive = activeTab === item.id;
                  const displayLabel = SHORT_LABELS[item.id] || item.defaultLabel;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`transition-colors select-none text-left focus:outline-none cursor-pointer shrink-0 whitespace-nowrap font-medium text-xs px-2 sm:px-2.5 py-1 rounded-lg ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                      title={item.defaultLabel}
                    >
                      {displayLabel}
                    </button>
                  );
                })}
            </nav>
          </div>

          {/* Bên phải: Bộ chuyển ngôn ngữ (VN/EN), Chuông thông báo (khi đã login) + Nút Đăng nhập hoặc Capsule người dùng rounded-full + Nút Đăng xuất rounded-full */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Bộ chuyển ngôn ngữ VN / EN dạng pill capsule bo tròn */}
            <div className="flex items-center bg-white/5 border border-white/10 p-0.5 rounded-full shadow-2xs">
              <button
                type="button"
                onClick={() => i18n.changeLanguage('vi-VN')}
                className={`px-2 py-0.5 rounded-full text-[11px] transition-all cursor-pointer ${
                  i18n.language?.startsWith('vi')
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tiếng Việt"
              >
                VN
              </button>
              <button
                type="button"
                onClick={() => i18n.changeLanguage('en-US')}
                className={`px-2 py-0.5 rounded-full text-[11px] transition-all cursor-pointer ${
                  i18n.language?.startsWith('en')
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Chuông thông báo: chỉ hiện khi isAuthenticated() */}
            {isAuthenticated() && (
              <div className="text-slate-300 hover:text-white [&_button]:hover:bg-white/10 shrink-0 flex items-center">
                <NotificationBadge />
              </div>
            )}

            {!isAuthenticated() ? (
              <Button
                onClick={() => navigate('/login')}
                className="h-9 px-3.5 sm:px-5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-950/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <User size={15} className="text-teal-100" />
                <span>Đăng nhập</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {/* Capsule người dùng rounded-full (không giới hạn cứng width, vai trò rút gọn) */}
                <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 px-2.5 sm:px-3 py-1.5 rounded-full shadow-2xs">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-900/80 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {user?.username?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight whitespace-nowrap">
                      {user?.username || 'Tài khoản'}
                    </span>
                    <span className="text-[10px] text-teal-400 font-medium leading-tight whitespace-nowrap">
                      {roleConfig?.defaultLabel?.split(' - ')[1] || roleConfig?.defaultLabel || 'Người dùng'}
                    </span>
                  </div>
                </div>

                {/* Nút Đăng xuất rounded-full */}
                <button
                  onClick={() => {
                    logout();
                    setActiveTab('home');
                    toast.success('Đã đăng xuất thành công');
                  }}
                  className="rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 px-2.5 sm:px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                  title="Đăng xuất"
                >
                  <LogOut size={14} className="text-rose-400" />
                  <span className="hidden md:inline">Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY CONTENT: If activeTab === 'home', show Landing Page sections. If activeTab !== 'home', show corresponding functional component */}
      {activeTab === 'home' ? (
        <>
          {/* 2. HERO SECTION - CỔNG THƯ VIỆN SỐ HIỆN ĐẠI (SLIDER NỀN TRƯỜNG TBD) */}
          <section
            id="hero"
            className="relative bg-slate-950 text-white overflow-hidden pt-12 pb-20 lg:pt-18 lg:pb-26 border-b border-white/10"
          >
        {/* Background Images Slider */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {HERO_IMAGES.map((imgUrl, index) => (
            <div
              key={imgUrl}
              className={`absolute inset-0 bg-center bg-cover transition-opacity duration-1000 ease-in-out ${
                index === currentHeroIndex ? 'opacity-100 scale-105 transition-transform duration-[10000ms]' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${imgUrl})` }}
            />
          ))}
          {/* Lớp gradient tối phủ lên ảnh nền */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/75 to-slate-950/90" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* CỘT TRÁI (7 cols) */}
            <div className="lg:col-span-7 text-left flex flex-col items-start">
              {/* Badge: Nền Tảng Thư Viện Số TBD */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-teal-300 text-xs sm:text-sm font-semibold mb-5 shadow-xs">
                <Sparkles size={15} className="text-teal-400" />
                <span>Nền Tảng Thư Viện Số TBD</span>
              </div>

              {/* Tiêu đề lớn: Không Gian Tri Thức & Nghiên Cứu Số */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-4">
                Không Gian Tri Thức &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-400">Nghiên Cứu Số</span>
              </h1>

              {/* Slogan ngắn gọn */}
              <p className="text-base sm:text-lg text-slate-200 font-normal max-w-xl mb-7 leading-relaxed">
                Kết nối bạn đọc với kho học liệu phong phú và dịch vụ mượn trả trực tuyến nhanh chóng.
              </p>

              {/* Quick Search Bar với nút Xanh Navy/Teal nổi bật */}
              <div id="quick-search-wrapper" className="w-full max-w-xl mb-7">
                <form
                  id="quick-search-form"
                  onSubmit={handleSearchSubmit}
                  className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl sm:rounded-full border border-white/20 shadow-2xl p-1.5 sm:p-2 gap-2 text-left transition-all focus-within:ring-2 focus-within:ring-teal-400"
                >
                  <div className="relative flex-1 flex items-center min-w-0">
                    <Search
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      id="quick-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (showSearchNotice) setShowSearchNotice(false);
                      }}
                      placeholder="Nhập tên sách, tác giả, chuyên ngành hoặc mã ISBN để tìm nhanh..."
                      className="w-full h-11 sm:h-12 pl-12 pr-4 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-sm sm:text-base font-medium"
                    />
                  </div>
                  <Button
                    id="quick-search-button"
                    type="submit"
                    className="h-11 sm:h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl sm:rounded-full text-sm transition-all shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
                  >
                    <Search size={16} className="text-teal-400 stroke-[2.5]" />
                    <span>Tìm kiếm</span>
                  </Button>
                </form>

                {/* Thông báo yêu cầu đăng nhập khi tìm kiếm */}
                {showSearchNotice && (
                  <div id="quick-search-notice" className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start sm:items-center gap-2.5 text-amber-900 text-xs sm:text-sm font-medium">
                      <Info size={18} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                      <span>Vui lòng đăng nhập hệ thống để tra cứu đầy đủ và đặt mượn sách!</span>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Button
                        id="quick-search-notice-login-btn"
                        size="sm"
                        onClick={() => navigate('/login')}
                        className="h-8 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Đăng nhập ngay</span>
                        <ArrowRight size={13} />
                      </Button>
                      <button
                        id="quick-search-notice-close-btn"
                        type="button"
                        onClick={() => setShowSearchNotice(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                        title="Đóng thông báo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3 Chỉ số nhanh */}
              <div className="w-full max-w-xl grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-white/15">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-teal-300 flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-base sm:text-lg leading-tight">50k+</div>
                    <div className="text-[11px] sm:text-xs text-slate-300 font-medium leading-tight">Tài liệu</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-emerald-300 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-base sm:text-lg leading-tight flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      24/7
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-300 font-medium leading-tight">Trực tuyến</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-teal-300 flex items-center justify-center shrink-0">
                    <Laptop size={20} />
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-base sm:text-lg leading-tight">Số hóa</div>
                    <div className="text-[11px] sm:text-xs text-slate-300 font-medium leading-tight">Mượn trả số</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI (5 cols): KHỐI CARD MÔ PHỎNG */}
            <div className="lg:col-span-5 relative">
              {/* Decorative subtle ambient backdrop blur */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-teal-500/20 via-emerald-500/20 to-indigo-500/10 rounded-3xl blur-2xl opacity-70" />

              <div className="relative bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white/20 shadow-2xl space-y-5 text-left text-slate-800">
                {/* Header: Tài nguyên nổi bật hôm nay */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">Tài nguyên nổi bật hôm nay</h3>
                      <span className="text-[11px] text-slate-400">Được bạn đọc mượn nhiều nhất</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Mới cập nhật
                  </span>
                </div>

                {/* Danh sách sách/học liệu tiêu biểu */}
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-100 transition-colors flex items-center gap-3">
                    <div className="w-9 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-extrabold text-[11px] shadow-xs shrink-0">
                      IT
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">Cấu Trúc Dữ Liệu &amp; Giải Thuật</h4>
                      <p className="text-[11px] text-slate-500 truncate">Khoa CNTT • PGS.TS Nguyễn Văn A</p>
                    </div>
                    <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md shrink-0">
                      Bản số 24/7
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50/80 hover:bg-teal-50/60 border border-slate-100 transition-colors flex items-center gap-3">
                    <div className="w-9 h-12 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-extrabold text-[11px] shadow-xs shrink-0">
                      ECO
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">Kinh Tế Vi Mô Ứng Dụng</h4>
                      <p className="text-[11px] text-slate-500 truncate">Khoa Kinh Tế &amp; Quản Trị • Tái bản 2026</p>
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md shrink-0">
                      Sẵn sàng
                    </span>
                  </div>
                </div>

                {/* Thẻ mượn sách nhanh (Digital Library Pass) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-teal-400/20 text-teal-300 flex items-center justify-center">
                        <QrCode size={14} />
                      </div>
                      <span className="text-xs font-bold tracking-wide uppercase text-slate-100">
                        Thẻ Mượn Sách Nhanh
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-teal-300 bg-teal-950/70 px-2.5 py-0.5 rounded-full border border-teal-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      Xác thực số
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Dành cho bạn đọc:</span>
                      <span className="font-semibold text-slate-200">Sinh viên &amp; Giảng viên TBD</span>
                    </div>
                    <Button
                      id="hero-quick-borrow-btn"
                      size="sm"
                      onClick={() => navigate('/login')}
                      className="h-8 px-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Mượn ngay</span>
                      <ArrowRight size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Chấm tròn (Indicator dots) ở góc dưới Hero */}
        <div id="hero-slider-indicators" className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              id={`hero-dot-${index}`}
              type="button"
              onClick={() => setCurrentHeroIndex(index)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                currentHeroIndex === index
                  ? 'w-7 sm:w-8 h-2 sm:h-2.5 bg-teal-400 shadow-sm shadow-teal-400/50'
                  : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Chuyển đến ảnh nền ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 3. LƯỚI TÍNH NĂNG ĐỘC LẬP (4 CỘT) */}
      <section id="features" className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Tra cứu học liệu (Teal) */}
          <div
            id="feature-card-search"
            onClick={() => {
              const searchInput = document.getElementById('quick-search-input');
              if (searchInput) {
                searchInput.focus();
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:border-teal-400 hover:shadow-xl hover:shadow-slate-200/70 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group text-left cursor-pointer"
          >
            <div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-50 to-teal-100/80 text-teal-600 border border-teal-200/50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Search size={24} className="stroke-[2.2]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                Tra cứu học liệu
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Kho sách in, ebook, tài liệu chuyên ngành phong phú phục vụ đào tạo và nghiên cứu chuyên sâu.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600">
              <span>Tra cứu ngay</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Quản lý mượn trả (Indigo) */}
          <div
            id="feature-card-borrow"
            onClick={() => navigate('/login')}
            className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-xl hover:shadow-slate-200/70 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group text-left cursor-pointer"
          >
            <div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100/80 text-indigo-600 border border-indigo-200/50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <BookMarked size={24} className="stroke-[2.2]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
                Quản lý mượn trả
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Đăng ký mượn 1 chạm, gia hạn sách thông minh và theo dõi thời hạn trả tài liệu nhanh chóng.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Mượn &amp; Gia hạn</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Không gian học tập (Amber) */}
          <div
            id="feature-card-spaces"
            onClick={() => scrollToSection('services')}
            className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:border-amber-400 hover:shadow-xl hover:shadow-slate-200/70 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group text-left cursor-pointer"
          >
            <div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-50 to-amber-100/80 text-amber-600 border border-amber-200/50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Users size={24} className="stroke-[2.2]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-amber-700 transition-colors">
                Không gian học tập
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Phòng tự học, thảo luận nhóm trang bị tiện nghi, máy tính tra cứu và kết nối mạng tốc độ cao.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
              <span>Xem tiện ích</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Dịch vụ số & Thủ thư (Rose) */}
          <div
            id="feature-card-services"
            onClick={() => scrollToSection('contact')}
            className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:border-rose-400 hover:shadow-xl hover:shadow-slate-200/70 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group text-left cursor-pointer"
          >
            <div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-50 to-rose-100/80 text-rose-600 border border-rose-200/50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Headphones size={24} className="stroke-[2.2]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-rose-700 transition-colors">
                Dịch vụ số &amp; Thủ thư
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tư vấn trích dẫn, hỗ trợ bạn đọc 24/7 và giải đáp mọi yêu cầu học thuật từ đội ngũ tận tâm.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
              <span>Liên hệ thủ thư</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: BỐ CỤC 2 CỘT SONG HÀNH (SPLIT SHOWCASE) - VIDEO & TIỆN ÍCH */}
      <section id="experience" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Cột 1: Video YouTube (55% độ rộng trên desktop) */}
          <div className="lg:col-span-7 w-full">
            <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl shadow-slate-300/50 bg-slate-950">
              <iframe
                className="w-full h-full border-0"
                src="https://www.youtube.com/embed/qqpFn4bEPys"
                title="Khám Phá Không Gian Học Tập &amp; Nghiên Cứu - Đại học Thái Bình Dương"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>

          {/* Cột 2: Thông tin & 3 Tiện ích xếp dọc (45% độ rộng trên desktop, căn lề trái) */}
          <div className="lg:col-span-5 text-left flex flex-col items-start">
            {/* Badge nhỏ trên cùng */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs sm:text-sm font-semibold mb-4 shadow-xs">
              <Play size={13} className="text-teal-600 fill-teal-600" />
              <span>Trải Nghiệm Học Tập TBD</span>
            </div>

            {/* Tiêu đề */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
              Không Gian Tri Thức &amp; Nghiên Cứu Hiện Đại
            </h2>

            {/* Lời dẫn */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 font-normal">
              Khuôn viên năng động cùng cơ sở vật chất truyền cảm hứng sáng tạo và học tập suốt đời.
            </p>

            {/* Danh sách 3 tiện ích xếp dọc (Vertical Feature List) */}
            <div className="w-full space-y-3 mb-6">
              {/* Tiện ích 1 */}
              <div className="flex items-start gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-teal-500/30 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors">
                    Học Liệu &amp; Giáo Trình Số
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                    Đồng bộ khung đào tạo, mở 24/7.
                  </p>
                </div>
              </div>

              {/* Tiện ích 2 */}
              <div className="flex items-start gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-teal-500/30 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Library size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors">
                    Cơ Sở Dữ Liệu Quốc Tế
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                    Kết nối nguồn nghiên cứu học thuật uy tín.
                  </p>
                </div>
              </div>

              {/* Tiện ích 3 */}
              <div className="flex items-start gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-teal-500/30 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Laptop size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors">
                    Không Gian Tự Học &amp; Sáng Tạo
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                    Phòng học nhóm và trạm tự mượn trả tiện nghi.
                  </p>
                </div>
              </div>
            </div>

            {/* Nút nhỏ: Đăng nhập khám phá */}
            <Button
              id="services-login-explore-btn"
              onClick={() => navigate('/login')}
              className="h-9 px-4 sm:px-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer group"
            >
              <User size={14} className="text-teal-400 group-hover:scale-110 transition-transform" />
              <span>Đăng nhập khám phá</span>
              <ArrowRight size={13} className="text-teal-400 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </div>
      </section>
        </>
      ) : (
        /* Workspace pane for functional tabs */
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-250">
          {/* Render Component Corresponding to activeTab */}
          <div className="w-full">
            {activeTab === 'dashboard' && <DashboardOverview />}
            {activeTab === 'catalog' && <BookList />}
            {activeTab === 'members' && <MemberList />}
            {activeTab === 'circulation' && (
              <div className="flex flex-col gap-6 w-full transition-all">
                <CirculationPanel />
                <ActiveLoans />
                <ReturnedUnpaidFines />
                <ActiveHolds />
              </div>
            )}
            {activeTab === 'users' && <UserList />}
            {activeTab === 'tenants' && <TenantList />}
            {activeTab === 'audit' && <AuditLogList />}
            {activeTab === 'reports' && <ReportBuilder />}
            {activeTab === 'search' && <SearchInterface />}
            {activeTab === 'policies' && <PolicyManager />}
            {activeTab === 'workflows' && <WorkflowManager />}
            {activeTab === 'scanner' && <BarcodeScanner />}
            {activeTab === 'print_codes' && <PrintManager />}
            {activeTab === 'transfers' && <TransferBoard />}
            {activeTab === 'imports' && <ImportExportManager />}
            {activeTab === 'integrations' && <IntegrationManager />}
            {activeTab === 'monitoring' && <MonitoringDashboard />}
            {activeTab === 'recommendations' && <RecommendationCenter />}
            {activeTab === 'branding' && <BrandingManager />}
            {activeTab === 'templates' && <TemplateManager />}

            {/* Member Portal Custom Sections */}
            {activeTab === 'my-loans' && <MemberLoansView />}
            {activeTab === 'my-holds' && <MemberHoldsView />}
            {activeTab === 'profile' && <MemberProfileView />}
          </div>
        </main>
      )}

      {/* 5. FOOTER 3 CỘT TINH GỌN (NỀN TỐI ĐỒNG NHẤT VỚI TOPBAR) */}
      <footer id="contact" className="mt-auto bg-slate-950 text-slate-300 pt-16 pb-16 border-t border-white/10 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
            {/* Cột 1: Logo TBD trắng, vạch ngăn và chữ THƯ VIỆN SỐ cùng lời giới thiệu */}
            <div id="footer-col-brand" className="space-y-4">
              <div 
                onClick={() => scrollToSection('hero')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <img
                  src="https://lms.tbd.edu.vn/pluginfile.php/1/theme_edumy/headerlogo1/1786323723/logo-TBD-white%20%282%29.png"
                  alt="Đại học Thái Bình Dương"
                  className="h-9 sm:h-10 object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="h-5 w-px bg-white/20" />
                <span className="text-sm sm:text-base font-bold tracking-wider text-teal-400 uppercase">
                  THƯ VIỆN SỐ
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pr-2">
                Cổng thông tin tri thức và học thuật số, phục vụ công tác giảng dạy, học tập và nghiên cứu khoa học của cộng đồng sinh viên, giảng viên Trường Đại học Thái Bình Dương (TBD).
              </p>
            </div>

            {/* Cột 2: Thông tin liên hệ */}
            <div id="footer-col-contact" className="space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Thông Tin Liên Hệ
              </h4>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-teal-400 shrink-0 mt-0.5" />
                  <span>Số 79 Mai Thị Dõng, P. Vĩnh Hải, TP. Nha Trang, Tỉnh Khánh Hòa</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-teal-400 shrink-0" />
                  <span>Hotline: <strong className="text-white font-semibold">(0258) 3727 147</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail size={15} className="text-teal-400 shrink-0" />
                  <span>Email: <a href="mailto:thuvien@tbd.edu.vn" className="text-teal-400 hover:underline">thuvien@tbd.edu.vn</a></span>
                </div>
              </div>
            </div>

            {/* Cột 3: Giờ mở cửa và nút Đăng nhập hệ thống đồng nhất */}
            <div id="footer-col-hours-login" className="space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Giờ Mở Cửa Phục Vụ
              </h4>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <Calendar size={15} className="text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-300 block">Thứ 2 – Thứ 7:</span>
                    <span className="font-mono text-sm font-bold text-teal-400">07:30 – 20:30</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                  <span>CSDL trực tuyến: Mở 24/7</span>
                </div>
              </div>

              {!isAuthenticated() ? (
                <div className="pt-2">
                  <Button
                    id="footer-login-btn"
                    onClick={() => navigate('/login')}
                    className="w-full h-11 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-950/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer group"
                  >
                    <User size={16} className="text-teal-100" />
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight size={14} className="text-teal-100 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              ) : (
                <div className="pt-2 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2.5 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>
                    Phiên làm việc: <strong className="text-white">{user?.username}</strong> ({roleConfig?.defaultLabel})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
