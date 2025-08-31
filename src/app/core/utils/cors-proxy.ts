/**
 * Utility class for handling CORS issues during development
 * This helps with Module Federation when the remote MFEs have CORS restrictions
 */
export class CorsProxy {
  private static proxyUrls = [
    'https://cors-anywhere.herokuapp.com/',
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url='
  ];

  /**
   * Attempts to fetch a resource through multiple CORS proxies until one succeeds
   * @param url The URL to fetch
   * @returns The response data as text
   */
  static async fetchWithProxy(url: string): Promise<string> {
    // First try direct fetch
    try {
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': '*/*',
          'Origin': window.location.origin
        }
      });
      
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      console.warn('Direct fetch failed, trying proxies', e);
    }

    // Try each proxy
    let lastError: Error | null = null;
    
    for (const proxyUrl of this.proxyUrls) {
      try {
        const proxiedUrl = `${proxyUrl}${encodeURIComponent(url)}`;
        const response = await fetch(proxiedUrl, {
          mode: 'cors',
          credentials: 'omit',
        });
        
        if (response.ok) {
          return await response.text();
        }
      } catch (e) {
        lastError = e as Error;
        console.warn(`Proxy ${proxyUrl} failed`, e);
        continue; // Try next proxy
      }
    }

    throw new Error(`All proxies failed to fetch ${url}. Last error: ${lastError?.message}`);
  }

  /**
   * Creates a proxy URL for the given URL using the first available proxy
   */
  static getProxyUrl(url: string): string {
    return `${this.proxyUrls[0]}${encodeURIComponent(url)}`;
  }
}
