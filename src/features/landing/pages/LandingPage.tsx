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
  CheckCircle2,
  Menu,
  X,
  Info,
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. HEADER / NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <div 
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <BookOpen size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
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
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Tra cứu tài liệu
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Dịch vụ
            </button>
            <button
              onClick={() => scrollToSection('hours')}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Giờ mở cửa
            </button>
          </nav>

          {/* Right CTA Button: Login */}
          <div className="hidden sm:flex items-center gap-3">
            <Button
              onClick={() => navigate('/login')}
              className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95"
            >
              <User size={16} />
              <span>Đăng nhập</span>
            </Button>
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              size="sm"
              onClick={() => navigate('/login')}
              className="h-9 px-3 bg-indigo-600 text-white font-bold text-xs rounded-lg"
            >
              <User size={14} className="mr-1" />
              Đăng nhập
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none"
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
              className="w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Trang chủ
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Tra cứu tài liệu
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Dịch vụ
            </button>
            <button
              onClick={() => scrollToSection('hours')}
              className="w-full text-left py-2 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Giờ mở cửa
            </button>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section
        id="hero"
        className="relative bg-slate-900 text-white overflow-hidden pt-20 pb-36 lg:pt-24 lg:pb-44"
      >
        {/* Background Image with Dark Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80"
            alt="Thư viện Đại học Thái Bình Dương"
            className="w-full h-full object-cover object-center opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-900/95" />
          {/* Subtle decorative dot mesh */}
          <div 
            className="absolute inset-0 opacity-10 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:24px_24px]" 
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs sm:text-sm font-semibold mb-6 backdrop-blur-xs">
            <Sparkles size={15} className="text-indigo-400" />
            <span>Cổng Thông Tin Tri Thức & Học Thuật Số TBD</span>
          </div>

          {/* Main Title */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight mb-5">
            Thư Viện Số Đại Học Thái Bình Dương
          </h2>

          {/* Slogan */}
          <p className="text-lg sm:text-xl text-slate-200 font-normal max-w-3xl mx-auto mb-8 leading-relaxed">
            Khơi nguồn tri thức – Nuôi dưỡng đam mê nghiên cứu và sáng tạo
          </p>

          {/* Quick Search Bar */}
          <div id="quick-search-wrapper" className="max-w-2xl mx-auto mb-8 w-full">
            <form
              id="quick-search-form"
              onSubmit={handleSearchSubmit}
              className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl sm:rounded-full border border-slate-200/90 shadow-2xl p-1.5 sm:p-2 gap-2 text-left transition-all"
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
                className="h-11 sm:h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl sm:rounded-full text-sm transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
              >
                <Search size={16} className="stroke-[2.5]" />
                <span>Tìm kiếm</span>
              </Button>
            </form>

            {/* Thông báo yêu cầu đăng nhập khi tìm kiếm */}
            {showSearchNotice && (
              <div id="quick-search-notice" className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-amber-500/20 border border-amber-400/40 backdrop-blur-md text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start sm:items-center gap-2.5 text-amber-100 text-xs sm:text-sm font-medium">
                  <Info size={18} className="text-amber-300 shrink-0 mt-0.5 sm:mt-0" />
                  <span>Vui lòng đăng nhập hệ thống để tra cứu đầy đủ và đặt mượn sách!</span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    id="quick-search-notice-login-btn"
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="h-8 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Đăng nhập ngay</span>
                    <ArrowRight size={13} />
                  </Button>
                  <button
                    id="quick-search-notice-close-btn"
                    type="button"
                    onClick={() => setShowSearchNotice(false)}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Đóng thông báo"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => scrollToSection('features')}
              variant="outline"
              className="w-full sm:w-auto h-12 px-7 bg-white/10 hover:bg-white/20 text-white border-white/25 rounded-xl font-bold backdrop-blur-xs transition-all flex items-center justify-center gap-2"
            >
              <Search size={18} />
              <span>Tra cứu tài liệu</span>
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto h-12 px-7 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <User size={18} />
              <span>Đăng nhập hệ thống</span>
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* 3. 4 KHỐI TÍNH NĂNG NỔI BẬT (Cards đè nhẹ lên chân banner) */}
      <section id="features" className="relative z-20 -mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Tra Cứu Tài Liệu */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/70 border border-slate-100 hover:border-indigo-200 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <Search size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Tra Cứu Tài Liệu</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Kho giáo trình, tài liệu số, luận văn chuyên ngành phong phú phục vụ toàn diện nhu cầu đào tạo và nghiên cứu.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Khám phá kho sách</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Mượn & Gia Hạn */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/70 border border-slate-100 hover:border-indigo-200 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <BookMarked size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Mượn & Gia Hạn</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Đăng ký mượn tài liệu trực tuyến và theo dõi lịch trả dễ dàng, chủ động gia hạn sách chỉ với vài thao tác.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Đăng ký trực tuyến</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Không Gian Tự Học */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/70 border border-slate-100 hover:border-indigo-200 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <Laptop size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Không Gian Tự Học</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Đặt chỗ phòng học nhóm, phòng nghiên cứu chuyên biệt hiện đại với đường truyền Internet tốc độ cao và tiện nghi.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Đặt phòng học tập</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Dịch Vụ Bạn Đọc */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/70 border border-slate-100 hover:border-indigo-200 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Dịch Vụ Bạn Đọc</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hướng dẫn tra cứu học thuật, cung cấp tài liệu liên thư viện và hỗ trợ trực tuyến 24/7 từ đội ngũ thủ thư tận tâm.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Hỗ trợ bạn đọc</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. DỊCH VỤ & THỐNG KÊ (Học thuật & Trải nghiệm số) */}
      <section id="services" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Dịch Vụ Trọng Tâm
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
            Hạ Tầng Hiện Đại – Tiện Ích Đỉnh Cao
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Được xây dựng nhằm mang lại trải nghiệm tra cứu và nghiên cứu khoa học tốt nhất cho toàn thể cán bộ, giảng viên và sinh viên.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mb-4">
              <GraduationCap size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Tài liệu học phần & Giáo trình</h4>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Cập nhật đồng bộ theo khung chương trình đào tạo của Đại học Thái Bình Dương với quyền truy cập bản in và bản điện tử.
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>Hơn 45.000 bản sách giấy chuyên khảo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>120.000+ tài liệu nội sinh và luận văn</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-start">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-4">
              <Layers size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Cơ sở dữ liệu quốc tế</h4>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Kết nối hệ thống cơ sở dữ liệu học thuật quốc tế (Scopus, ScienceDirect, IEEE, ProQuest) phục vụ nghiên cứu chuyên sâu.
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-indigo-500 shrink-0" />
                <span>Truy cập toàn văn bài báo khoa học</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-indigo-500 shrink-0" />
                <span>Hỗ trợ trích dẫn và kiểm tra đạo văn</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-start">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl mb-4">
              <Library size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">Không gian học tập sáng tạo</h4>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Không gian mở đa năng, khu đọc yên tĩnh, phòng thuyết trình nhóm và khu vực mượn trả tự động RFID hiện đại.
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-500 shrink-0" />
                <span>Sức chứa hơn 600 chỗ ngồi đồng thời</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-500 shrink-0" />
                <span>Trạm tự mượn trả Self-Check 24/7</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. KHU VỰC TÓM TẮT: THỜI GIAN MỞ CỬA & LIÊN HỆ */}
      <section id="hours" className="bg-slate-100/80 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Thời gian mở cửa */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian hoạt động</span>
                  <h3 className="text-lg font-bold text-slate-900">Giờ Mở Cửa Phục Vụ</h3>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Thứ 2 – Thứ 7</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-700 font-mono">07:30 – 20:30</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Chủ nhật & Ngày Lễ</span>
                  </div>
                  <span className="text-sm font-medium text-slate-500">Nghỉ phục vụ trực tiếp (Tài nguyên số mở 24/7)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Hệ thống cơ sở dữ liệu số & Tra cứu trực tuyến mở liên tục 24/7.</span>
              </div>
            </div>

            {/* Địa chỉ liên hệ & Hỗ trợ */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin liên hệ</span>
                  <h3 className="text-lg font-bold text-slate-900">Địa Chỉ & Hỗ Trợ Bạn Đọc</h3>
                </div>
              </div>

              <div className="space-y-3.5 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Cơ sở chính:</strong> Số 79 Mai Thị Dõng, Phường Vĩnh Hải, TP. Nha Trang, Tỉnh Khánh Hòa
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-indigo-600 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Hotline Thư viện:</strong> (0258) 3727 147 – Ext: 108
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-indigo-600 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Email hỗ trợ:</strong> thuvien@tbd.edu.vn
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <User size={16} />
                  <span>Đăng nhập cổng thông tin Thư viện</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="mt-auto bg-slate-950 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <span className="text-sm font-bold text-slate-200">
                THƯ VIỆN ĐẠI HỌC THÁI BÌNH DƯƠNG (TBD LIBRARY)
              </span>
            </div>
            <p className="text-xs text-slate-400 text-center md:text-right">
              © {new Date().getFullYear()} Bản quyền thuộc về Thư viện Trường Đại học Thái Bình Dương. Tất cả các quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
