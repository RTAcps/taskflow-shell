import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { NotificationService } from './notification.service';

/**
 * Status types for remote modules
 */
export enum RemoteModuleStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

/**
 * Interface for remote modules registry
 */
export interface RemoteModuleInfo {
  name: string;
  status: RemoteModuleStatus;
  exposedModule: string;
  displayName: string;
  error?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ModuleFederationService {
  private moduleRegistry = new Map<string, RemoteModuleInfo>();
  private moduleStatus = new BehaviorSubject<Map<string, RemoteModuleInfo>>(new Map());
  
  public moduleStatus$ = this.moduleStatus.asObservable();

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.initializeRegistry();
  }

  /**
   * Initialize the module registry with all available remote modules
   */
  private initializeRegistry(): void {
    // Project Management module
    this.registerModule('project-management', 'taskflow-component', './ProjectListComponent', 'Gerenciamento de Projetos');
    
    // Real-time collaboration module
    this.registerModule('real-time-collaboration', 'taskflow-reactive', './RealTimeCollaborationComponent', 'Colaboração em Tempo Real');
    
    // Analytics module
    this.registerModule('analytics', 'taskflow-functional', './AnalyticsReportComponent', 'Relatórios de Análise');
  }

  /**
   * Register a remote module in the registry
   */
  private registerModule(name: string, remoteName: string, exposedModule: string, displayName: string): void {
    const moduleInfo: RemoteModuleInfo = {
      name,
      status: RemoteModuleStatus.IDLE,
      exposedModule,
      displayName
    };
    
    this.moduleRegistry.set(name, moduleInfo);
    this.updateStatus();
  }

  /**
   * Update the module status BehaviorSubject
   */
  private updateStatus(): void {
    this.moduleStatus.next(new Map(this.moduleRegistry));
  }

  /**
   * Get a specific module's status
   */
  getModuleStatus(name: string): RemoteModuleStatus {
    return this.moduleRegistry.get(name)?.status || RemoteModuleStatus.ERROR;
  }

  /**
   * Get a list of all registered modules
   */
  getAllModules(): RemoteModuleInfo[] {
    return Array.from(this.moduleRegistry.values());
  }

  /**
   * Navigate to the fallback component with a friendly error message
   */
  navigateToFallback(moduleName: string): void {
    const moduleInfo = this.moduleRegistry.get(moduleName);
    if (moduleInfo) {
      this.notificationService.showErrorWithRedirect(
        `O módulo "${moduleInfo.displayName}" não está disponível no momento. Por favor, tente novamente mais tarde.`,
        '/',
        3000,
        'Módulo Indisponível'
      );
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * Find the component class in a remote module loaded via Module Federation
   * This is particularly useful for standalone components
   * @param module The loaded remote module object
   * @param expectedName The expected name of the component (optional)
   * @returns The component class or undefined if not found
   */
  findComponentInRemoteModule(module: any, expectedName?: string): any {
    console.log(`🔍 Procurando componente no módulo:`, module);
    console.log(`🔍 Nome esperado:`, expectedName);
    
    if (!module) {
      console.error('❌ Módulo vazio ou undefined');
      return undefined;
    }
    
    // First try the expected name if provided
    if (expectedName && module[expectedName]) {
      console.log(`✅ Componente encontrado via nome esperado: ${expectedName}`);
      return module[expectedName];
    }
    
    // Then try known naming conventions for component exports
    if (module.default) {
      console.log(`✅ Componente encontrado via default export`);
      // ESM default export
      return module.default;
    }
    
    // Find by name pattern (ends with Component)
    const componentKey = Object.keys(module).find(key => 
      typeof module[key] === 'function' && 
      key.endsWith('Component')
    );
    
    if (componentKey) {
      console.log(`✅ Componente encontrado via padrão de nome: ${componentKey}`);
      return module[componentKey];
    }
    
    // If all else fails, try to find any class that looks like a component
    const anyComponentLikeKey = Object.keys(module).find(key => 
      typeof module[key] === 'function' && 
      module[key].prototype
    );
    
    if (anyComponentLikeKey) {
      console.log(`✅ Componente encontrado via busca genérica: ${anyComponentLikeKey}`);
      return module[anyComponentLikeKey];
    }
    
    console.error('❌ Nenhum componente encontrado no módulo');
    return undefined;
  }
}
