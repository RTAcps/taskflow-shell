import { loadRemoteModule } from '@angular-architects/module-federation';

/**
 * Helper to load remote modules with robust error handling
 */
export class ModuleFederationHelper {
  private static loadingCache = new Map<string, Promise<any>>();
  
  /**
   * Load a remote module with automatic retry and caching
   */
  static async loadRemoteModuleWithRetry(options: {
    remoteEntry: string;
    exposedModule: string;
    remoteName: string;
    maxRetries?: number;
    retryDelay?: number;
  }): Promise<any> {
    const { remoteEntry, exposedModule, remoteName, maxRetries = 3, retryDelay = 1000 } = options;
    const cacheKey = `${remoteName}:${exposedModule}`;
    
    if (this.loadingCache.has(cacheKey)) {
      console.log(`🔄 Using cached loading promise for ${cacheKey}`);
      return this.loadingCache.get(cacheKey);
    }
    
    const loadingPromise = this.attemptLoad(remoteEntry, exposedModule, remoteName, maxRetries, retryDelay);
    this.loadingCache.set(cacheKey, loadingPromise);

    loadingPromise.catch(() => {
      this.loadingCache.delete(cacheKey);
    });
    
    return loadingPromise;
  }
  
  private static async attemptLoad(
    remoteEntry: string, 
    exposedModule: string, 
    remoteName: string, 
    maxRetries: number, 
    retryDelay: number
  ): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Loading attempt ${attempt}/${maxRetries} for ${remoteName} -> ${exposedModule}`);
        
        if (attempt > 1) {
          await this.delay(retryDelay * attempt);
        }
        
        if (typeof window !== 'undefined' && !(window as any).__webpack_require__) {
          console.warn(`⚠️ Webpack require not ready, waiting...`);
          await this.delay(500);
        }
        
        const module = await loadRemoteModule({
          type: 'module',
          remoteEntry,
          exposedModule
        });
        
        console.log(`✅ Successfully loaded ${remoteName} -> ${exposedModule} on attempt ${attempt}`);
        return module;
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Attempt ${attempt}/${maxRetries} failed for ${remoteName}:`, error.message);
        
        const isRetryableError = this.isRetryableError(error);
        
        if (attempt === maxRetries || !isRetryableError) {
          break;
        }
        
        console.log(`🔄 Will retry in ${retryDelay * attempt}ms...`);
      }
    }
    
    console.error(`💥 Failed to load ${remoteName} after ${maxRetries} attempts`);
    throw lastError;
  }
  
  private static isRetryableError(error: any): boolean {
    if (!error || !error.message) return false;
    
    const retryableMessages = [
      'is not a function',
      'Cannot read properties',
      'init is not a function',
      'get is not a function',
      'Loading script failed',
      'Network error',
      'Failed to fetch',
      'Loading CSS chunk',
      'Loading chunk'
    ];
    
    return retryableMessages.some(msg => error.message.includes(msg));
  }
  
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Clean the loading cache
   */
  static clearCache(): void {
    this.loadingCache.clear();
    console.log('🧹 Module Federation cache cleared');
  }
  
  /**
   * Verify if a module is loading
   */
  static isLoading(remoteName: string, exposedModule: string): boolean {
    const cacheKey = `${remoteName}:${exposedModule}`;
    return this.loadingCache.has(cacheKey);
  }
}
