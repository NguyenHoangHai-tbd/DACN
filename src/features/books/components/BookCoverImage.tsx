import React, { useState } from 'react';

export const getInitials = (title: string): string => {
  if (!title) return 'B';
  const cleanTitle = title.trim();
  const words = cleanTitle.split(' ');
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return cleanTitle.slice(0, 2).toUpperCase();
};

export interface BookCoverImageProps {
  src?: string;
  isbn?: string;
  title: string;
  category?: string;
  className?: string;
}

// Curated authentic covers for standard library collection
const KNOWN_COVERS: Record<string, string> = {
  // Clean Code (Robert C. Martin)
  '9780132350884': 'https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg',
  '0132350882': 'https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg',
  'clean code': 'https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg',

  // Artificial Intelligence: A Modern Approach (Stuart Russell, Peter Norvig)
  '9780134610993': 'https://covers.openlibrary.org/b/isbn/9780134610993-M.jpg',
  '9780136042594': 'https://covers.openlibrary.org/b/isbn/9780134610993-M.jpg',
  'artificial intelligence': 'https://covers.openlibrary.org/b/isbn/9780134610993-M.jpg',
  'trí tuệ nhân tạo': 'https://covers.openlibrary.org/b/isbn/9780134610993-M.jpg',
  'tri tue nhan tao': 'https://covers.openlibrary.org/b/isbn/9780134610993-M.jpg',

  // Domain-Driven Design (Eric Evans)
  '9780321125217': 'https://covers.openlibrary.org/b/isbn/9780321125217-M.jpg',
  '0321125215': 'https://covers.openlibrary.org/b/isbn/9780321125217-M.jpg',
  'domain-driven design': 'https://covers.openlibrary.org/b/isbn/9780321125217-M.jpg',
  'domain driven design': 'https://covers.openlibrary.org/b/isbn/9780321125217-M.jpg',

  // Mắt biếc (Nguyễn Nhật Ánh)
  '9786041122334': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'mat biec': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'mắt biếc': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',

  // Thần điêu đại hiệp (Kim Dung)
  '9786045566778': 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
  'than dieu dai hiep': 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
  'thần điêu đại hiệp': 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',

  // Other popular books
  '9780201616224': 'https://covers.openlibrary.org/b/isbn/9780201616224-M.jpg', // Pragmatic Programmer
  '9780201633610': 'https://covers.openlibrary.org/b/isbn/9780201633610-M.jpg', // Design Patterns GoF
  '9780201485677': 'https://covers.openlibrary.org/b/isbn/9780201485677-M.jpg', // Refactoring Martin Fowler
  '9780262033848': 'https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg', // Introduction to Algorithms
};

const CATEGORY_COVERS: Record<string, string> = {
  software: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
  ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
  literature: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80',
  general: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
};

export const resolveCoverUrl = (src?: string, isbn?: string, title?: string, category?: string): string | undefined => {
  if (src && src.trim().length > 0 && !src.includes('placeholder') && !src.startsWith('data:')) {
    return src.trim();
  }

  const cleanIsbn = (isbn || '').replace(/[^0-9X]/gi, '');
  if (cleanIsbn && KNOWN_COVERS[cleanIsbn]) {
    return KNOWN_COVERS[cleanIsbn];
  }

  const normalizedTitle = (title || '').toLowerCase().trim();
  for (const [key, url] of Object.entries(KNOWN_COVERS)) {
    if (key.length > 3 && normalizedTitle.includes(key)) {
      return url;
    }
  }

  // Generic 10 or 13-digit ISBN OpenLibrary lookup
  if (cleanIsbn.length === 10 || cleanIsbn.length === 13) {
    return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`;
  }

  // Category keyword fallback
  const cat = (category || '').toLowerCase();
  if (cat.includes('phần mềm') || cat.includes('software') || cat.includes('lập trình') || normalizedTitle.includes('code') || normalizedTitle.includes('program')) {
    return CATEGORY_COVERS.software;
  }
  if (cat.includes('trí tuệ nhân tạo') || cat.includes('ai') || normalizedTitle.includes('ai') || normalizedTitle.includes('learning')) {
    return CATEGORY_COVERS.ai;
  }
  if (cat.includes('văn học') || cat.includes('tiểu thuyết') || cat.includes('truyện') || cat.includes('literature')) {
    return CATEGORY_COVERS.literature;
  }

  // Common library/test books fallback
  if (normalizedTitle.includes('flow') || normalizedTitle.includes('test') || normalizedTitle.includes('borrow')) {
    return CATEGORY_COVERS.software;
  }

  // Universal authentic library book cover fallback
  return CATEGORY_COVERS.general;
};

export const BookCoverImage: React.FC<BookCoverImageProps> = ({ 
  src, 
  isbn, 
  title, 
  category, 
  className = "w-12 h-16" 
}) => {
  const [hasError, setHasError] = useState(false);
  const resolved = resolveCoverUrl(src, isbn, title, category);
  const initials = getInitials(title);

  if (resolved && !hasError) {
    return (
      <div className={`relative group/cover inline-block ${className} shrink-0 overflow-hidden rounded-lg shadow-sm border border-slate-200/80 bg-slate-100`}>
        <img
          src={resolved}
          alt={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover/cover:scale-105"
        />
        {/* Subtle realistic book spine & lighting overlay */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/30 via-white/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-lg pointer-events-none" />
      </div>
    );
  }

  // Generate aesthetic bento-style pastel/vivid gradient backdrops
  const colors = [
    'from-indigo-100/40 to-indigo-50 text-indigo-700 border-indigo-200/60',
    'from-amber-100/40 to-amber-50 text-amber-700 border-amber-200/60',
    'from-rose-100/40 to-rose-50 text-rose-700 border-rose-200/60',
    'from-emerald-100/40 to-emerald-50 text-emerald-700 border-emerald-200/60',
    'from-cyan-100/40 to-cyan-50 text-cyan-700 border-cyan-200/60',
    'from-purple-100/40 to-purple-50 text-purple-700 border-purple-200/60'
  ];

  const hash = title ? title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const colorClass = colors[hash % colors.length];

  return (
    <div 
      className={`${className} rounded-lg bg-gradient-to-br ${colorClass} font-bold select-none text-[11px] tracking-wider flex flex-col items-center justify-center border shrink-0 shadow-sm relative overflow-hidden`}
      title={title}
    >
      <span className="relative z-10 font-mono font-bold leading-none">{initials}</span>
      <div className="absolute inset-0 bg-white/10 opacity-40 mix-blend-overlay"></div>
      <div className="absolute inset-y-0 left-0 w-1 bg-black/10"></div>
    </div>
  );
};
