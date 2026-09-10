import { axiosInstance } from '../../../shared/api/axiosInstance';
import { ApiResponse } from '../../auth/types';
import { BrandingConfig, LocaleConfig, TranslationOverride, AiThemeSuggestion } from '../types';

export const brandingService = {
  getBranding: async (): Promise<BrandingConfig> => {
    const res = await axiosInstance.get<ApiResponse<BrandingConfig>>('/branding');
    return res.data.data;
  },

  updateBranding: async (data: Partial<BrandingConfig>): Promise<BrandingConfig> => {
    const res = await axiosInstance.put<ApiResponse<BrandingConfig>>('/branding', data);
    return res.data.data;
  },

  getLocale: async (): Promise<LocaleConfig> => {
    const res = await axiosInstance.get<ApiResponse<LocaleConfig>>('/locales');
    return res.data.data;
  },

  updateLocale: async (data: Partial<LocaleConfig>): Promise<LocaleConfig> => {
    const res = await axiosInstance.put<ApiResponse<LocaleConfig>>('/locales', data);
    return res.data.data;
  },

  getTranslationOverrides: async (): Promise<TranslationOverride[]> => {
     // Mocking it
     return [];
  },

  saveTranslationOverride: async (override: TranslationOverride): Promise<boolean> => {
    const res = await axiosInstance.post<ApiResponse<boolean>>('/translations/overrides', override);
    return res.data.data;
  },

  getAiThemeSuggestion: async (libraryType: string): Promise<AiThemeSuggestion> => {
    const res = await axiosInstance.post<ApiResponse<AiThemeSuggestion>>('/ai/branding/suggest', { libraryType });
    return res.data.data;
  }
};
