/**
 * Gets data from cache storage (chrome.storage.local or localStorage)
 * @param key - Cache key
 * @returns Cached data or null if not found
 */
export async function getCacheData<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([key], (result) => {
        const data = result[key];
        resolve(data ? (data as T) : null);
      });
    } else {
      // Fallback for non-extension environments
      const stored = window.localStorage.getItem(key);
      resolve(stored ? (JSON.parse(stored) as T) : null);
    }
  });
}

/**
 * Sets data to cache storage (chrome.storage.local or localStorage)
 * @param key - Cache key
 * @param data - Data to cache
 */
export async function setCacheData<T>(key: string, data: T): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: data }, () => {
        resolve();
      });
    } else {
      // Fallback for non-extension environments
      window.localStorage.setItem(key, JSON.stringify(data));
      resolve();
    }
  });
}

/**
 * Removes data from cache storage
 * @param key - Cache key
 */
export async function removeCacheData(key: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove([key], () => {
        resolve();
      });
    } else {
      // Fallback for non-extension environments
      window.localStorage.removeItem(key);
      resolve();
    }
  });
}
