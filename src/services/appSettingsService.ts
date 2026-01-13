/**
 * App Settings Service
 * خدمة إعدادات التطبيق - للحصول على القيم الديناميكية من قاعدة البيانات
 * 
 * This service provides centralized access to all configurable app settings,
 * eliminating the need for hardcoded values throughout the codebase.
 */

import { supabase } from '@/integrations/supabase/client';

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Cache for settings to reduce database calls
let settingsCache: Map<string, AppSetting> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Fetch all public settings from the database
 */
export async function getAllSettings(): Promise<AppSetting[]> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('is_public', true)
    .order('category');

  if (error) {
    console.error('Error fetching app settings:', error);
    return [];
  }

  // Update cache
  settingsCache = new Map();
  for (const setting of data || []) {
    settingsCache.set(setting.key, setting as AppSetting);
  }
  cacheTimestamp = Date.now();

  return (data || []) as AppSetting[];
}

/**
 * Get a single setting value by key
 */
export async function getSetting(key: string): Promise<string | null> {
  // Check cache first
  if (settingsCache && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    const cached = settingsCache.get(key);
    if (cached) return cached.value;
  }

  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }

  return data?.value || null;
}

/**
 * Get multiple settings at once
 */
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', keys);

  if (error) {
    console.error('Error fetching multiple settings:', error);
    return {};
  }

  const result: Record<string, string> = {};
  for (const item of data || []) {
    result[item.key] = item.value;
  }
  return result;
}

/**
 * Get settings by category
 */
export async function getSettingsByCategory(category: string): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .eq('category', category);

  if (error) {
    console.error(`Error fetching settings for category ${category}:`, error);
    return {};
  }

  const result: Record<string, string> = {};
  for (const item of data || []) {
    result[item.key] = item.value;
  }
  return result;
}

/**
 * Get a numeric setting value
 */
export async function getNumberSetting(key: string, defaultValue: number = 0): Promise<number> {
  const value = await getSetting(key);
  if (value === null) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get a JSON setting value
 */
export async function getJsonSetting<T>(key: string): Promise<T | null> {
  const value = await getSetting(key);
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    console.error(`Error parsing JSON setting ${key}`);
    return null;
  }
}

/**
 * Update a setting (admin only)
 */
export async function updateSetting(key: string, value: string): Promise<boolean> {
  const { error } = await supabase
    .from('app_settings')
    .update({ value })
    .eq('key', key);

  if (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }

  // Invalidate cache
  settingsCache = null;
  return true;
}

/**
 * Invalidate the settings cache
 */
export function invalidateSettingsCache(): void {
  settingsCache = null;
  cacheTimestamp = 0;
}

// ============================================================
// CONVENIENCE FUNCTIONS FOR SPECIFIC SETTINGS
// وظائف مساعدة للحصول على إعدادات محددة
// ============================================================

/**
 * Get contact information settings
 */
export async function getContactInfo(): Promise<{
  companyName: string;
  phone: string;
  phoneRaw: string;
  email: string;
  website: string;
  addressEn: string;
  addressRu: string;
  addressAr: string;
}> {
  const settings = await getSettings([
    'company_name',
    'company_phone',
    'company_phone_raw',
    'company_email',
    'company_website',
    'company_address_en',
    'company_address_ru',
    'company_address_ar'
  ]);

  return {
    companyName: settings.company_name || 'Volga Services',
    phone: settings.company_phone || '+7 952 221 29 03',
    phoneRaw: settings.company_phone_raw || '79522212903',
    email: settings.company_email || 'info@volgaservices.com',
    website: settings.company_website || 'www.volgaservices.com',
    addressEn: settings.company_address_en || 'Leningrad Region, Murino',
    addressRu: settings.company_address_ru || 'Ленинградская обл., Мурино',
    addressAr: settings.company_address_ar || 'منطقة لينينغراد، مورينو'
  };
}

/**
 * Get social media settings
 */
export async function getSocialSettings(): Promise<{
  whatsappNumber: string;
  facebookUrl: string;
  instagramUrl: string;
}> {
  const settings = await getSettings([
    'whatsapp_number',
    'facebook_url',
    'instagram_url'
  ]);

  return {
    whatsappNumber: settings.whatsapp_number || '79522212903',
    facebookUrl: settings.facebook_url || '',
    instagramUrl: settings.instagram_url || ''
  };
}

/**
 * Get bank transfer details
 */
export async function getBankDetails(): Promise<{
  bankName: string;
  accountHolder: string;
  iban: string;
  swift: string;
}> {
  const settings = await getSettings([
    'bank_name',
    'bank_account_holder',
    'bank_iban',
    'bank_swift'
  ]);

  return {
    bankName: settings.bank_name || 'Arab African International Bank',
    accountHolder: settings.bank_account_holder || 'AHMED KAMAL ALSaeed Alshourbagy',
    iban: settings.bank_iban || 'EG960057028801154116110010201',
    swift: settings.bank_swift || 'ARAIEGCXCOL'
  };
}

/**
 * Get driver pricing configuration
 */
export async function getDriverPricing(): Promise<{
  basePrice: number;
  businessAddon: number;
  suvAddon: number;
  minivanAddon: number;
  vanAddon: number;
  busAddon: number;
  roundTripMultiplier: number;
}> {
  const settings = await getSettings([
    'driver_base_price',
    'driver_business_addon',
    'driver_suv_addon',
    'driver_minivan_addon',
    'driver_van_addon',
    'driver_bus_addon',
    'driver_round_trip_multiplier'
  ]);

  return {
    basePrice: parseFloat(settings.driver_base_price) || 50,
    businessAddon: parseFloat(settings.driver_business_addon) || 30,
    suvAddon: parseFloat(settings.driver_suv_addon) || 20,
    minivanAddon: parseFloat(settings.driver_minivan_addon) || 40,
    vanAddon: parseFloat(settings.driver_van_addon) || 60,
    busAddon: parseFloat(settings.driver_bus_addon) || 100,
    roundTripMultiplier: parseFloat(settings.driver_round_trip_multiplier) || 1.8
  };
}
