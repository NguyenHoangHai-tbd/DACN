export interface BrandingConfig {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  themeStyle: 'light' | 'dark' | 'system';
}

export interface LocaleConfig {
  defaultLocale: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
}

export interface TranslationOverride {
  key: string;
  value: string;
  locale: string;
}

export interface AiThemeSuggestion {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  reason: string;
}
