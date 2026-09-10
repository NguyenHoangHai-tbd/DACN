import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enUS from './locales/en-US.json';
import viVN from './locales/vi-VN.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': { translation: enUS },
      'vi-VN': { translation: viVN },
    },
    lng: 'vi-VN',
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;
