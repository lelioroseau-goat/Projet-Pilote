import React, { useState, useRef, useEffect } from 'react';
import { useI18n, languageMap } from '../contexts/i18n';
import { Language } from '../types';
import { GlobeAltIcon, ChevronDownIcon, CheckIcon } from './icons';

interface LanguageSelectorProps {
  variant?: 'header' | 'menu' | 'inline' | 'compact';
  className?: string;
  onSelect?: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  className = '',
  onSelect,
}) => {
  const { language, setLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableLanguages: Language[] = ['fr', 'en', 'es'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
    onSelect?.();
  };

  const currentLangInfo = languageMap[language] || languageMap.fr;

  // Inline buttons variant (e.g. inside login or settings modal)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 ${className}`}>
        {availableLanguages.map((lang) => {
          const info = languageMap[lang];
          const isSelected = language === lang;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => handleSelectLanguage(lang)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title={info.name}
            >
              <span className="text-sm">{info.flag}</span>
              <span>{info.short}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Menu items list (compact horizontal row for inside user profile dropdown menu)
  if (variant === 'menu') {
    return (
      <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors ${className}`}>
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
            <GlobeAltIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800">{t('header.language')}</span>
        </div>
        <div className="flex items-center space-x-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200/80">
          {availableLanguages.map((lang) => {
            const info = languageMap[lang];
            const isSelected = language === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleSelectLanguage(lang)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title={info.name}
              >
                <span>{info.flag}</span>
                <span>{info.short}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Header Dropdown (Default)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title={t('language.select')}
        aria-label={t('language.select')}
        aria-expanded={isOpen}
      >
        <span className="text-sm">{currentLangInfo.flag}</span>
        <span className="font-semibold text-slate-800">{currentLangInfo.short}</span>
        <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black/5 border border-slate-100 py-1.5 z-50 animate-in fade-in duration-100">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center space-x-1">
            <GlobeAltIcon className="w-3 h-3 text-slate-400" />
            <span>{t('language.select')}</span>
          </div>
          {availableLanguages.map((lang) => {
            const info = languageMap[lang];
            const isSelected = language === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleSelectLanguage(lang)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">{info.flag}</span>
                  <span className="text-slate-800">{info.name}</span>
                </div>
                {isSelected && <CheckIcon className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
