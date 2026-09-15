import React, { useState } from 'react';
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
  Layers,
  ChevronRight,
  Menu,
  X,
  Info,
  QrCode,
  Headphones,
  Users,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchNotice, setShowSearchNotice] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
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
      {/* 1. HEADER / NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <div 
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-400 border border-slate-800 flex items-center justify-center shadow-md shadow-slate-900/15 group-hover:scale-105 transition-transform">
              <BookOpen size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-wider bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                  TBD Library
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight tracking-tight uppercase">
                Thư Viện Đại Học Thái Bình Dương
              </h1>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <button
              onClick={() => scrollToSection('hero')}
              className="hover:text-teal-600 transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-teal-600 transition-colors cursor-pointer"
            >
              Tra cứu học liệu
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="hover:text-teal-600 transition-colors cursor-pointer"
            >
              Dịch vụ
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="hover:text-teal-600 transition-colors cursor-pointer"
            >
              Liên hệ &amp; Giờ mở cửa
            </button>
          </nav>

          {/* Right CTA Button: Login (Xanh Navy chủ đạo) */}
          <div className="hidden sm:flex items-center gap-3">
            <Button
              onClick={() => navigate('/login')}
              className="h-10 px-5 bg-slate-900 hover:bg-indigo-950 text-white font-bold rounded-xl shadow-md shadow-slate-900/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <User size={16} className="text-teal-400" />
              <span>Đăng nhập</span>
            </Button>
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              size="sm"
              onClick={() => navigate('/login')}
              className="h-9 px-3 bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
            >
              <User size={14} className="mr-1 text-teal-400" />
              Đăng nhập
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-4 space-y-2 shadow-lg">
            <button
              onClick={() => scrollToSection('hero')}
              className="w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Trang chủ
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Tra cứu học liệu
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Dịch vụ
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Liên hệ &amp; Giờ mở cửa
            </button>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION - CỔNG THƯ VIỆN SỐ HIỆN ĐẠI (NỀN SÁNG) */}
      <section
        id="hero"
        className="relative bg-gradient-to-b from-slate-50 via-indigo-50/30 to-white text-slate-800 overflow-hidden pt-12 pb-16 lg:pt-18 lg:pb-24 border-b border-slate-200/60"
      >
        {/* Soft glow ambient effects */}
        <div className="absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle decorative dot mesh */}
        <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* CỘT TRÁI (7 cols) */}
            <div className="lg:col-span-7 text-left flex flex-col items-start">
              {/* Badge: Nền Tảng Thư Viện Số TBD */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs sm:text-sm font-semibold mb-5 shadow-xs">
                <Sparkles size={15} className="text-indigo-600" />
                <span>Nền Tảng Thư Viện Số TBD</span>
              </div>

              {/* Tiêu đề lớn: Không Gian Tri Thức & Nghiên Cứu Số */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-4">
                Không Gian Tri Thức &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600">Nghiên Cứu Số</span>
              </h1>

              {/* Slogan ngắn gọn */}
              <p className="text-base sm:text-lg text-slate-600 font-normal max-w-xl mb-7 leading-relaxed">
                Kết nối bạn đọc với kho học liệu phong phú và dịch vụ mượn trả trực tuyến nhanh chóng.
              </p>

              {/* Quick Search Bar với nút Xanh Navy/Teal nổi bật */}
              <div id="quick-search-wrapper" className="w-full max-w-xl mb-7">
                <form
                  id="quick-search-form"
                  onSubmit={handleSearchSubmit}
                  className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl sm:rounded-full border border-slate-200/90 shadow-lg shadow-slate-200/50 p-1.5 sm:p-2 gap-2 text-left transition-all hover:border-slate-300 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100"
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
                    className="h-11 sm:h-12 px-6 bg-slate-900 hover:bg-indigo-950 text-white font-bold rounded-xl sm:rounded-full text-sm transition-all shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
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
              <div className="w-full max-w-xl grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-slate-200/80">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">50k+</div>
                    <div className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">Tài liệu</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      24/7
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">Trực tuyến</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Laptop size={20} />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">Số hóa</div>
                    <div className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight">Mượn trả số</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI (5 cols): KHỐI CARD MÔ PHỎNG */}
            <div className="lg:col-span-5 relative">
              {/* Decorative subtle ambient backdrop blur */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500/20 via-teal-500/20 to-emerald-500/10 rounded-3xl blur-2xl opacity-70" />

              <div className="relative bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xl shadow-indigo-100/80 space-y-5 text-left">
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

      {/* 3.5 & 4. KHỐI LIỀN MẠCH: VIDEO GIỚI THIỆU & 3 THẺ TIỆN ÍCH TỐI GIẢN */}
      <section id="services" className="pt-16 sm:pt-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge nhỏ: Trải Nghiệm Học Tập TBD */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs sm:text-sm font-semibold mb-4 shadow-xs">
          <Play size={13} className="text-teal-600 fill-teal-600" />
          <span>Trải Nghiệm Học Tập TBD</span>
        </div>

        {/* Tiêu đề */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Khám Phá Không Gian Học Tập &amp; Nghiên Cứu
        </h2>

        {/* Lời dẫn ngắn */}
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
          Khuôn viên năng động, cơ sở vật chất hiện đại cùng không gian thư viện truyền cảm hứng sáng tạo tại Đại học Thái Bình Dương.
        </p>

        {/* Khung video YouTube: căn giữa, 16:9, bo góc lớn, viền mờ cao cấp, đổ bóng mềm */}
        <div className="relative mx-auto w-full max-w-4xl aspect-video rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl shadow-slate-200/80 bg-slate-950 mb-12 sm:mb-16">
          <iframe
            className="w-full h-full border-0"
            src="https://www.youtube.com/embed/qqpFn4bEPys"
            title="Khám Phá Không Gian Học Tập &amp; Nghiên Cứu - Đại học Thái Bình Dương"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* 3 Thẻ Tiện Ích Tối Giản (Minimal Cards) - Đồng bộ tông màu Teal / Slate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          {/* Thẻ 1: Học Liệu & Giáo Trình */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-500/40 hover:shadow-md transition-all duration-200 flex flex-col items-start group">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 border border-teal-100/80 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
              Học Liệu &amp; Giáo Trình
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cập nhật đồng bộ theo chương trình đào tạo, truy cập bản in và bản số 24/7.
            </p>
          </div>

          {/* Thẻ 2: Cơ Sở Dữ Liệu Quốc Tế */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-500/40 hover:shadow-md transition-all duration-200 flex flex-col items-start group">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Layers size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
              Cơ Sở Dữ Liệu Quốc Tế
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kết nối nguồn tài nguyên học thuật uy tín phục vụ nghiên cứu chuyên sâu.
            </p>
          </div>

          {/* Thẻ 3: Không Gian Sáng Tạo */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-500/40 hover:shadow-md transition-all duration-200 flex flex-col items-start group">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 border border-teal-100/80 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Library size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
              Không Gian Sáng Tạo
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Phòng tự học, khu thảo luận nhóm và trạm mượn trả tự động tiện nghi.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FOOTER 3 CỘT TINH GỌN (NỀN TỐI SANG TRỌNG) */}
      <footer id="contact" className="mt-auto bg-slate-900 text-slate-300 pt-16 pb-16 border-t border-slate-800 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
            {/* Cột 1: Logo, tên Thư viện Đại học Thái Bình Dương và lời giới thiệu ngắn */}
            <div id="footer-col-brand" className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-teal-400 border border-slate-700/60 flex items-center justify-center shadow-md shadow-black/20">
                  <BookOpen size={20} className="stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider block">
                    TBD Library
                  </span>
                  <span className="text-sm font-bold text-white uppercase tracking-tight block">
                    Thư Viện Đại Học Thái Bình Dương
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pr-2">
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
                  <span>Email: <a href="mailto:thuvien@tbd.edu.vn" className="text-teal-300 hover:underline">thuvien@tbd.edu.vn</a></span>
                </div>
              </div>
            </div>

            {/* Cột 3: Giờ mở cửa và nút Đăng nhập hệ thống */}
            <div id="footer-col-hours-login" className="space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Giờ Mở Cửa Phục Vụ
              </h4>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <Calendar size={15} className="text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block">Thứ 2 – Thứ 7:</span>
                    <span className="font-mono text-sm font-bold text-teal-300">07:30 – 20:30</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                  <span>CSDL trực tuyến: Mở 24/7</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  id="footer-login-btn"
                  onClick={() => navigate('/login')}
                  className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs rounded-xl shadow-md shadow-black/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer group"
                >
                  <User size={15} className="text-teal-400 group-hover:scale-110 transition-transform" />
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight size={14} className="text-teal-400 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
