const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  API_URL: process.env.EXPO_PUBLIC_API_URL || '',
  RORK_API_URL: process.env.EXPO_PUBLIC_RORK_API_BASE_URL || '',
  PUSH_NOTIFICATIONS_ENABLED: process.env.EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED === 'true',
  ANALYTICS_ENABLED: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'true',
};

const isValidSupabaseUrl = (url: string): boolean => {
  if (!url) return false;
  if (url === 'https://your-project-id.supabase.co') return false;
  return url.includes('supabase.co') || url.includes('supabase.in');
};

const isValidSupabaseKey = (key: string): boolean => {
  if (!key) return false;
  if (key === 'your-anon-key-here') return false;
  return key.length > 20;
};

export const Config = {
  supabase: {
    url: ENV.SUPABASE_URL,
    anonKey: ENV.SUPABASE_ANON_KEY,
    isConfigured: isValidSupabaseUrl(ENV.SUPABASE_URL) && isValidSupabaseKey(ENV.SUPABASE_ANON_KEY),
  },
  api: {
    baseUrl: ENV.API_URL || ENV.RORK_API_URL,
    hasCustomApi: Boolean(ENV.API_URL),
    hasRorkApi: Boolean(ENV.RORK_API_URL),
  },
  app: {
    name: 'ParcelPeer',
    version: '1.0.0',
    platformFeePercent: 20,
    travelerPayoutPercent: 80,
    minAppVersion: '1.0.0',
  },
  features: {
    enableSupabaseAuth: isValidSupabaseUrl(ENV.SUPABASE_URL) && isValidSupabaseKey(ENV.SUPABASE_ANON_KEY),
    enablePushNotifications: ENV.PUSH_NOTIFICATIONS_ENABLED,
    enableAnalytics: ENV.ANALYTICS_ENABLED,
    enableOfflineMode: true,
  },
  validation: {
    phoneRegex: /^(\+91)?[6-9]\d{9}$/,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    aadhaarRegex: /^\d{12}$/,
    panRegex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    pincodeRegex: /^\d{6}$/,
    ifscRegex: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    upiRegex: /^[\w.-]+@[\w]+$/,
  },
  defaults: {
    currency: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
  },
  limits: {
    maxParcelWeight: 50,
    maxParcelValue: 100000,
    maxQuoteAmount: 50000,
    minQuoteAmount: 50,
    otpExpiryMinutes: 10,
    sessionExpiryDays: 30,
  },
};

export const isProduction = (): boolean => {
  return !__DEV__;
};

export const isDevelopment = (): boolean => {
  return __DEV__;
};

export const getApiUrl = (): string => {
  if (Config.api.baseUrl) {
    return Config.api.baseUrl;
  }
  console.warn('[Config] No API URL configured, some features may not work');
  return '';
};

export const isSupabaseConfigured = (): boolean => {
  return Config.supabase.isConfigured;
};

export const getEnvironmentInfo = () => {
  return {
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    hasSupabase: Config.supabase.isConfigured,
    hasApi: Boolean(Config.api.baseUrl),
    apiType: Config.api.hasCustomApi ? 'custom' : Config.api.hasRorkApi ? 'rork' : 'none',
  };
};

export const validateConfig = (): { valid: boolean; warnings: string[]; errors: string[] } => {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!Config.api.baseUrl) {
    errors.push('No API URL configured - backend features will not work');
  }

  if (!Config.supabase.isConfigured) {
    warnings.push('Supabase not configured - using local authentication and storage');
  }

  if (isProduction() && !Config.supabase.isConfigured) {
    warnings.push('Running in production without Supabase - data will not persist');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
};

if (__DEV__) {
  const configValidation = validateConfig();
  if (configValidation.warnings.length > 0) {
    console.log('[Config] Warnings:', configValidation.warnings);
  }
  if (configValidation.errors.length > 0) {
    console.error('[Config] Errors:', configValidation.errors);
  }
}
