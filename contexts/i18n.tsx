import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../types';

export const languageMap: Record<Language, { code: string; name: string; short: string; flag: string }> = {
  fr: { code: 'fr-FR', name: 'Français', short: 'FR', flag: '🇫🇷' },
  en: { code: 'en-US', name: 'English', short: 'EN', flag: '🇬🇧' },
  es: { code: 'es-ES', name: 'Español', short: 'ES', flag: '🇪🇸' },
};

interface I18nContextType {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{
  language?: Language;
  onLanguageChange?: (language: Language) => void;
  children: React.ReactNode;
}> = ({ language: propLanguage, onLanguageChange, children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    if (propLanguage) return propLanguage;
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('app_language') as Language) : null;
    if (stored && (stored === 'fr' || stored === 'en' || stored === 'es')) {
      return stored;
    }
    return 'fr';
  });

  // Sync if propLanguage changes from outside (e.g. user logs in with saved preference)
  useEffect(() => {
    if (propLanguage && propLanguage !== currentLanguage) {
      setCurrentLanguage(propLanguage);
    }
  }, [propLanguage]);

  const setLanguage = (newLanguage: Language) => {
    setCurrentLanguage(newLanguage);
    try {
      localStorage.setItem('app_language', newLanguage);
    } catch {
      // ignore localstorage errors in restricted contexts
    }
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const langDict = translations[currentLanguage] || translations.en;
    let text = langDict[key] || key;
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        text = text.replace(`{{${paramKey}}}`, String(paramValue));
      }
    }
    return text;
  };

  const locale = languageMap[currentLanguage]?.code || 'en-US';

  return (
    <I18nContext.Provider value={{ language: currentLanguage, locale, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
