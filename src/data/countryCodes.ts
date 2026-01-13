/**
 * Country codes with dial codes for phone number input
 * ISO-2 format with E.164 dial codes
 */

export interface CountryData {
  code: string;      // ISO-2 country code
  name: string;      // Country name
  dialCode: string;  // Dial code with + prefix
  flag: string;      // Flag emoji
  pattern?: RegExp;  // Validation pattern (optional)
  example?: string;  // Example phone number
}

export const COUNTRIES: CountryData[] = [
  { 
    code: 'EG', 
    name: 'Egypt', 
    dialCode: '+20', 
    flag: '🇪🇬',
    pattern: /^\d{10}$/,
    example: '1012345678'
  },
  { 
    code: 'SA', 
    name: 'Saudi Arabia', 
    dialCode: '+966', 
    flag: '🇸🇦',
    pattern: /^5\d{8}$/,
    example: '512345678'
  },
  { 
    code: 'AE', 
    name: 'United Arab Emirates', 
    dialCode: '+971', 
    flag: '🇦🇪',
    pattern: /^5\d{8}$/,
    example: '501234567'
  },
  { 
    code: 'RU', 
    name: 'Russia', 
    dialCode: '+7', 
    flag: '🇷🇺',
    pattern: /^\d{10}$/,
    example: '9121234567'
  },
  { 
    code: 'US', 
    name: 'United States', 
    dialCode: '+1', 
    flag: '🇺🇸',
    pattern: /^\d{10}$/,
    example: '2025551234'
  },
  { 
    code: 'GB', 
    name: 'United Kingdom', 
    dialCode: '+44', 
    flag: '🇬🇧',
    pattern: /^\d{10,11}$/,
    example: '7911123456'
  },
  { 
    code: 'DE', 
    name: 'Germany', 
    dialCode: '+49', 
    flag: '🇩🇪',
    pattern: /^\d{10,11}$/,
    example: '15123456789'
  },
  { 
    code: 'FR', 
    name: 'France', 
    dialCode: '+33', 
    flag: '🇫🇷',
    pattern: /^\d{9}$/,
    example: '612345678'
  },
  { 
    code: 'IT', 
    name: 'Italy', 
    dialCode: '+39', 
    flag: '🇮🇹',
    pattern: /^\d{9,10}$/,
    example: '3123456789'
  },
  { 
    code: 'ES', 
    name: 'Spain', 
    dialCode: '+34', 
    flag: '🇪🇸',
    pattern: /^\d{9}$/,
    example: '612345678'
  },
  { 
    code: 'TR', 
    name: 'Turkey', 
    dialCode: '+90', 
    flag: '🇹🇷',
    pattern: /^\d{10}$/,
    example: '5321234567'
  },
  { 
    code: 'IN', 
    name: 'India', 
    dialCode: '+91', 
    flag: '🇮🇳',
    pattern: /^\d{10}$/,
    example: '9876543210'
  },
  { 
    code: 'CN', 
    name: 'China', 
    dialCode: '+86', 
    flag: '🇨🇳',
    pattern: /^\d{11}$/,
    example: '13812345678'
  },
  { 
    code: 'JP', 
    name: 'Japan', 
    dialCode: '+81', 
    flag: '🇯🇵',
    pattern: /^\d{10}$/,
    example: '9012345678'
  },
  { 
    code: 'KR', 
    name: 'South Korea', 
    dialCode: '+82', 
    flag: '🇰🇷',
    pattern: /^\d{9,10}$/,
    example: '1012345678'
  },
  { 
    code: 'AU', 
    name: 'Australia', 
    dialCode: '+61', 
    flag: '🇦🇺',
    pattern: /^\d{9}$/,
    example: '412345678'
  },
  { 
    code: 'BR', 
    name: 'Brazil', 
    dialCode: '+55', 
    flag: '🇧🇷',
    pattern: /^\d{10,11}$/,
    example: '11912345678'
  },
  { 
    code: 'KW', 
    name: 'Kuwait', 
    dialCode: '+965', 
    flag: '🇰🇼',
    pattern: /^\d{8}$/,
    example: '50123456'
  },
  { 
    code: 'QA', 
    name: 'Qatar', 
    dialCode: '+974', 
    flag: '🇶🇦',
    pattern: /^\d{8}$/,
    example: '50123456'
  },
  { 
    code: 'BH', 
    name: 'Bahrain', 
    dialCode: '+973', 
    flag: '🇧🇭',
    pattern: /^\d{8}$/,
    example: '31234567'
  },
  { 
    code: 'OM', 
    name: 'Oman', 
    dialCode: '+968', 
    flag: '🇴🇲',
    pattern: /^\d{8}$/,
    example: '91234567'
  },
  { 
    code: 'JO', 
    name: 'Jordan', 
    dialCode: '+962', 
    flag: '🇯🇴',
    pattern: /^\d{9}$/,
    example: '791234567'
  },
  { 
    code: 'LB', 
    name: 'Lebanon', 
    dialCode: '+961', 
    flag: '🇱🇧',
    pattern: /^\d{7,8}$/,
    example: '71123456'
  },
  { 
    code: 'MA', 
    name: 'Morocco', 
    dialCode: '+212', 
    flag: '🇲🇦',
    pattern: /^\d{9}$/,
    example: '612345678'
  },
  { 
    code: 'TN', 
    name: 'Tunisia', 
    dialCode: '+216', 
    flag: '🇹🇳',
    pattern: /^\d{8}$/,
    example: '20123456'
  }
].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Get country by ISO-2 code
 */
export function getCountryByCode(code: string): CountryData | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/**
 * Get country by dial code
 */
export function getCountryByDialCode(dialCode: string): CountryData | undefined {
  return COUNTRIES.find(c => c.dialCode === dialCode);
}

/**
 * Normalize phone number to E.164 format
 */
export function toE164(phone: string, dialCode: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Ensure dialCode starts with +
  const prefix = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  
  return `${prefix}${digits}`;
}

/**
 * Validate phone number for a specific country
 */
export function validatePhoneForCountry(phone: string, countryCode: string): boolean {
  const country = getCountryByCode(countryCode);
  if (!country) return false;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Use pattern if available, otherwise just check length
  if (country.pattern) {
    return country.pattern.test(digits);
  }
  
  // Generic validation: 7-15 digits
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Format phone for display
 */
export function formatPhoneDisplay(phone: string, dialCode: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${dialCode} ${digits}`;
}

/**
 * Popular countries for quick selection (top of dropdown)
 */
export const POPULAR_COUNTRIES = ['EG', 'SA', 'AE', 'RU', 'US', 'GB'];

/**
 * Get popular countries first, then rest alphabetically
 */
export function getOrderedCountries(): CountryData[] {
  const popular = POPULAR_COUNTRIES.map(code => getCountryByCode(code)).filter(Boolean) as CountryData[];
  const rest = COUNTRIES.filter(c => !POPULAR_COUNTRIES.includes(c.code));
  return [...popular, ...rest];
}
