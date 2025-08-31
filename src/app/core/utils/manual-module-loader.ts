
import { environment } from '../../../environments/environment';
import { ModuleUnavailableComponent } from '../../shared/module-unavailable/module-unavailable.component';
import { CompatibilityErrorComponent } from '../../shared/compatibility-error/compatibility-error.component';
import { ModulePerformanceService } from '../services/module-performance.service';

/**
 * Manual loader for remote modules when Module Federation has compatibility issues
 * Especially useful for dealing with errors like "m[d].get is not a function" and "d.init is not a function"
 */
export class ManualModuleLoader {
  private static readonly performanceService = new ModulePerformanceService();
  
  /**
   * Load a remote module manually
   * This bypasses compatibility issues between different versions of Angular/Webpack
   */
  static async loadRemoteModule(remoteName: string, exposedModule: string): Promise<any> {
    this.performanceService.startLoading(remoteName, exposedModule, 'manual');
    
    try {
      console.log(`🔄 Iniciando carregamento manual de ${remoteName} -> ${exposedModule}`);
      await this.loadRemoteScript(remoteName);
      const container = await this.initializeContainer(remoteName);
      const moduleFactory = await this.getModuleFactory(container, remoteName, exposedModule);
      const module = await this.initializeModule(moduleFactory, remoteName, exposedModule);
      this.performanceService.completeLoading(remoteName, exposedModule, 'manual');
      return module;
    } catch (error) {
      this.performanceService.failLoading(remoteName, exposedModule, 'manual', error);
      return this.handleLoadingError(error, remoteName, exposedModule);
    }
  }
  
  /**
   * Load the remoteEntry.js script
   */
  private static async loadRemoteScript(remoteName: string): Promise<void> {
    const remoteUrl = environment.remoteUrls[remoteName as keyof typeof environment.remoteUrls];
    if (!remoteUrl) {
      throw new Error(`URL não configurada para o módulo remoto: ${remoteName}`);
    }
    
    const existingScript = document.querySelector(`script[src="${remoteUrl}"]`);
    if (!existingScript) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = remoteUrl;
        script.type = 'text/javascript';
        script.onerror = () => reject(new Error(`Falha ao carregar script: ${remoteUrl}`));
        script.onload = () => {
          console.log(`✅ Script carregado: ${remoteUrl}`);
          resolve();
        };
        document.head.appendChild(script);
      });
      
      await this.delay(500);
    } else {
      console.log(`⚠️ Script já carregado anteriormente: ${remoteUrl}`);
    }
  }
  
  /**
   * Initialize the container for Module Federation
   */
  private static async initializeContainer(remoteName: string): Promise<any> {
    const containerKey = remoteName;
    const container = (window as any)[containerKey];
    
    if (!container) {
      console.error(`❌ Container não encontrado: ${containerKey}`);
      throw new Error(`Container não encontrado: ${containerKey}`);
    }
    
    try {
      if (typeof container.init === 'function') {
        await container.init((window as any).__webpack_share_scopes__.default);
        console.log(`✅ Container inicializado via init()`);
      } 
      else if (container.initPromise && typeof container.initPromise.then === 'function') {
        await container.initPromise;
        console.log(`✅ Container inicializado via initPromise`);
      }
      else {
        console.log(`⚠️ Nenhum método de inicialização encontrado, assumindo que o container já está inicializado`);
      }
    } catch (initError) {
      console.warn(`⚠️ Erro ao inicializar container, continuando mesmo assim:`, initError);
    }
    
    return container;
  }
  
  /**
   * Retrieve the module factory from the container
   */
  private static async getModuleFactory(container: any, remoteName: string, exposedModule: string): Promise<any> {
    try {
      if (typeof container.get === 'function') {
        const factory = await container.get(exposedModule);
        console.log(`✅ Módulo obtido via container.get()`);
        return factory;
      } 
      else if (container[exposedModule]) {
        console.log(`✅ Módulo obtido via acesso direto container[exposedModule]`);
        return container[exposedModule];
      }
      else {
        const possibleModules = Object.keys(container).filter(key => 
          typeof container[key] === 'function' || 
          (typeof container[key] === 'object' && container[key] !== null)
        );
        
        console.log(`🔍 Procurando módulo nas propriedades:`, possibleModules);
        
        if (possibleModules.length > 0) {
          console.log(`✅ Módulo obtido via fallback: ${possibleModules[0]}`);
          return container[possibleModules[0]];
        } else {
          throw new Error(`Não foi possível encontrar o módulo: ${exposedModule}`);
        }
      }
    } catch (getError) {
      console.error(`❌ Erro ao obter módulo:`, getError);
      throw getError;
    }
  }
  
  /**
   * Initialize the module from the factory
   */
  private static async initializeModule(moduleFactory: any, remoteName: string, exposedModule: string): Promise<any> {
    let module;
    
    if (typeof moduleFactory === 'function') {
      module = moduleFactory();
      console.log(`✅ Módulo inicializado via factory`);
    } else if (moduleFactory && typeof moduleFactory.then === 'function') {
      module = await moduleFactory;
      console.log(`✅ Módulo inicializado via promise`);
    } else {
      module = moduleFactory;
      console.log(`✅ Usando módulo diretamente`);
    }
    
    console.log(`✅ Módulo carregado com sucesso:`, module);
    return module;
  }
  
  /**
   * Handle module loading errors
   */
  private static handleLoadingError(error: any, remoteName: string, exposedModule: string): any {
    console.error(`❌ Erro no carregamento manual de ${remoteName} -> ${exposedModule}:`, error);
    
    if (error instanceof Error && error.message.includes('CORS')) {
      console.error(`🔧 DICA: Este erro de CORS indica que o MFE ${remoteName} está configurado para aceitar apenas o domínio de produção.`);
      console.error(`🔧 Para desenvolvimento local, o MFE precisa permitir 'http://localhost:4200' nas configurações de CORS.`);
    }
    
    const isCompatibilityError = 
      error instanceof Error && (
        error.message.includes('is not a function') || 
        error.message.includes('init is not a function') || 
        error.message.includes('get is not a function')
      );
    
    return { 
      default: isCompatibilityError ? CompatibilityErrorComponent : ModuleUnavailableComponent 
    };
  }
  
  /**
   * Helper for creating delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Verify if Webpack is available
   */
  static isWebpackAvailable(): boolean {
    return typeof (window as any).__webpack_require__ !== 'undefined';
  }
}
