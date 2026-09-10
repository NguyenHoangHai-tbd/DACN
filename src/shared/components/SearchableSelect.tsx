import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
  className?: string;
  clearable?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options = [],
  placeholder = 'Chọn một mục...',
  disabled = false,
  emptyText = 'Không tìm thấy dữ liệu',
  className = '',
  clearable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync search input focus when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on query
  const filteredOptions = searchQuery
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full h-10 px-3 py-2 text-sm bg-white border rounded-xl transition-all shadow-sm ${
          disabled
            ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 cursor-pointer'
            : 'border-slate-200 hover:border-slate-300 cursor-pointer'
        }`}
      >
        <span className={`truncate block text-slate-800 ${!selectedOption ? 'text-slate-400' : 'font-medium'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-205 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-150 max-h-72 flex flex-col">
          {/* Search box */}
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10 flex items-center gap-2 shrink-0">
            <Search size={14} className="text-slate-400 ml-1 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              className="w-full text-xs font-medium bg-transparent border-0 outline-none focus:ring-0 p-0.5 text-slate-800 placeholder-slate-400"
              placeholder="Gõ từ khóa để tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-300 hover:text-slate-500 p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1 py-1 divide-y divide-slate-50 max-h-52">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-start justify-between px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                       <span className="block font-semibold truncate text-slate-800">{opt.label}</span>
                       {opt.description && (
                         <span className={`block text-[10.5px] mt-0.5 truncate leading-tight ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>
                           {opt.description}
                         </span>
                       )}
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-indigo-600 shrink-0 self-center ml-1" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
