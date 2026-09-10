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

interface BookCoverImageProps {
  src?: string;
  title: string;
  className?: string;
}

export const BookCoverImage: React.FC<BookCoverImageProps> = ({ src, title, className = "w-12 h-16" }) => {
  const [errorUs, setErrorUs] = useState(false);
  const initials = getInitials(title);

  if (src && !errorUs) {
    return (
      <img
        src={src}
        alt={title}
        referrerPolicy="no-referrer"
        onError={() => setErrorUs(true)}
        className={`${className} object-cover rounded-lg shadow-sm border border-slate-200 shrink-0`}
      />
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
    </div>
  );
};
