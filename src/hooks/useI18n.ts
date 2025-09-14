import { useState, useEffect } from 'react';
import { i18n, Language, TranslationKey } from '@/lib/i18n';

export const useI18n = () => {
  const [language, setLanguageState] = useState<Language>(i18n.getLanguage());
  
  useEffect(() => {
    i18n.init();
    setLanguageState(i18n.getLanguage());
  }, []);
  
  const setLanguage = (lang: Language) => {
    i18n.setLanguage(lang);
    setLanguageState(lang);
  };
  
  const t = (key: TranslationKey) => i18n.t(key);
  
  return {
    language,
    setLanguage,
    t,
  };
};