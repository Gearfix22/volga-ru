/**
 * React Hook for App Settings
 * هوك لاستخدام إعدادات التطبيق في المكونات
 */

import { useState, useEffect } from 'react';
import { 
  getContactInfo, 
  getSocialSettings, 
  getBankDetails, 
  getDriverPricing,
  getSetting,
  getSettings as getMultipleSettings
} from '@/services/appSettingsService';

// Types for settings
export interface ContactInfo {
  companyName: string;
  phone: string;
  phoneRaw: string;
  email: string;
  website: string;
  addressEn: string;
  addressRu: string;
  addressAr: string;
}

export interface SocialSettings {
  whatsappNumber: string;
  facebookUrl: string;
  instagramUrl: string;
}

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  iban: string;
  swift: string;
}

export interface DriverPricing {
  basePrice: number;
  businessAddon: number;
  suvAddon: number;
  minivanAddon: number;
  vanAddon: number;
  busAddon: number;
  roundTripMultiplier: number;
}

/**
 * Hook to get contact information
 */
export function useContactInfo() {
  const [data, setData] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const info = await getContactInfo();
        setData(info);
      } catch (err) {
        setError('Failed to load contact info');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}

/**
 * Hook to get social settings
 */
export function useSocialSettings() {
  const [data, setData] = useState<SocialSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settings = await getSocialSettings();
        setData(settings);
      } catch (err) {
        setError('Failed to load social settings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}

/**
 * Hook to get bank details
 */
export function useBankDetails() {
  const [data, setData] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const details = await getBankDetails();
        setData(details);
      } catch (err) {
        setError('Failed to load bank details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}

/**
 * Hook to get driver pricing
 */
export function useDriverPricing() {
  const [data, setData] = useState<DriverPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pricing = await getDriverPricing();
        setData(pricing);
      } catch (err) {
        setError('Failed to load driver pricing');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}

/**
 * Generic hook to get a single setting
 */
export function useSetting(key: string, defaultValue: string = '') {
  const [value, setValue] = useState<string>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getSetting(key);
        if (result !== null) {
          setValue(result);
        }
      } catch (err) {
        console.error(`Failed to load setting ${key}:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [key]);

  return { value, loading };
}

/**
 * Hook to get multiple settings at once
 */
export function useSettings(keys: string[]) {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getMultipleSettings(keys);
        setData(result);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [keys.join(',')]);

  return { data, loading };
}
