import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ModulePerformanceService {
  private loadingStats: Map<string, {
    attempts: number,
    startTime: number,
    endTime?: number,
    success: boolean,
    error?: any,
    method: string
  }> = new Map();
  
  /**
   * Registers the start of loading a module
   */
  startLoading(remoteName: string, exposedModule: string, method: string): void {
    const key = `${remoteName}:${exposedModule}`;
    const existingStat = this.loadingStats.get(key);
    
    if (existingStat) {
      this.loadingStats.set(key, {
        ...existingStat,
        attempts: existingStat.attempts + 1,
        startTime: Date.now(),
        method
      });
    } else {
      this.loadingStats.set(key, {
        attempts: 1,
        startTime: Date.now(),
        success: false,
        method
      });
    }
    
    console.log(`⏱️ [${method}] Iniciando carregamento de ${remoteName} -> ${exposedModule}`);
  }
  
  /**
   * Registers the success of loading a module
   */
  completeLoading(remoteName: string, exposedModule: string, method: string): void {
    const key = `${remoteName}:${exposedModule}`;
    const stat = this.loadingStats.get(key);
    
    if (stat) {
      const endTime = Date.now();
      const duration = endTime - stat.startTime;
      
      this.loadingStats.set(key, {
        ...stat,
        endTime,
        success: true,
        method
      });
      
      console.log(`✅ [${method}] Módulo ${remoteName} -> ${exposedModule} carregado em ${duration}ms`);
      this.logLoadingStats();
    }
  }
  
  /**
   * Registers the failure of loading a module
   */
  failLoading(remoteName: string, exposedModule: string, method: string, error: any): void {
    const key = `${remoteName}:${exposedModule}`;
    const stat = this.loadingStats.get(key);
    
    if (stat) {
      const endTime = Date.now();
      const duration = endTime - stat.startTime;
      
      this.loadingStats.set(key, {
        ...stat,
        endTime,
        success: false,
        error,
        method
      });
      
      console.error(`❌ [${method}] Falha ao carregar ${remoteName} -> ${exposedModule} após ${duration}ms`, error);
    }
  }
  
  /**
   * Shows loading statistics for the modules
   */
  logLoadingStats(): void {
    if (!environment.production) {
      console.log('📊 Loading statistics for modules:');

      this.loadingStats.forEach((stat, key) => {
        const [remoteName, exposedModule] = key.split(':');
        const duration = stat.endTime ? (stat.endTime - stat.startTime) : 'N/A';
        
        console.log(`  - ${remoteName} -> ${exposedModule}:`);
        console.log(`    • Método: ${stat.method}`);
        console.log(`    • Tentativas: ${stat.attempts}`);
        console.log(`    • Duração: ${duration}ms`);
        console.log(`    • Sucesso: ${stat.success}`);
        
        if (stat.error) {
          console.log(`    • Erro: ${stat.error.message || stat.error}`);
        }
      });
    }
  }
  
  /**
   * Get stats for a specific module
   */
  getModuleStats(remoteName: string, exposedModule: string) {
    const key = `${remoteName}:${exposedModule}`;
    return this.loadingStats.get(key);
  }
}
