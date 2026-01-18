/**
 * Safe translation utilities - NEVER returns raw translation keys
 * This is the last line of defense against showing raw keys in UI
 */

/**
 * Convert a translation key to a readable fallback
 * e.g., "common.welcomeBack" -> "Welcome Back"
 */
export function keyToReadableFallback(key: string): string {
  // Get the last part of the key (after the last dot)
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1];
  
  // Convert camelCase/snake_case to readable text
  return lastPart
    // Insert space before capitals
    .replace(/([A-Z])/g, ' $1')
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Capitalize first letter
    .replace(/^./, str => str.toUpperCase())
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a translation result looks like a raw key
 */
export function isRawKey(result: string, key: string): boolean {
  if (!result || !key) return false;
  
  // If the result equals the key, it's definitely a raw key
  if (result === key) return true;
  
  // If the result contains dots and matches the key pattern, it's likely a raw key
  if (result.includes('.') && result === key.split(':').pop()) return true;
  
  // Check common patterns that indicate raw keys
  const rawKeyPatterns = [
    /^[a-z]+\.[a-zA-Z]+$/,  // e.g., common.welcomeBack
    /^[a-z]+\.[a-z]+\.[a-zA-Z]+$/,  // e.g., namespace.section.key
  ];
  
  return rawKeyPatterns.some(pattern => pattern.test(result));
}

/**
 * Safe translate function - guarantees readable output
 */
export function safeTranslate(
  t: (key: string, options?: any) => string,
  key: string,
  options?: any,
  fallback?: string
): string {
  try {
    const result = t(key, options);
    
    // If the result looks like a raw key, use the fallback
    if (isRawKey(result, key)) {
      return fallback || keyToReadableFallback(key);
    }
    
    return result;
  } catch (error) {
    console.error(`[safeTranslate] Error translating key "${key}":`, error);
    return fallback || keyToReadableFallback(key);
  }
}

/**
 * Create a wrapped translation function that never returns raw keys
 */
export function createSafeT(t: (key: string, options?: any) => string) {
  return function safeT(key: string, options?: any): string {
    return safeTranslate(t, key, options);
  };
}
