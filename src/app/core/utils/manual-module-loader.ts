
import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment.interface';
import { ModuleUnavailableComponent } from '../../shared/module-unavailable/module-unavailable.component';
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
    
    try {
      const timestamp = Date.now();
      const urlWithVersion = `${remoteUrl}?v=${timestamp}`;
      
      const existingScript = document.querySelector(`script[src*="${remoteUrl}"]`);
      if (existingScript) {
        console.log(`⚠️ Script já carregado anteriormente: ${remoteUrl}`);
        await this.delay(500); 
        return;
      }
      
      this.setupWebpackGlobals();
      
      // Try different loading strategies in sequence
      try {
        // Strategy 1: Direct script loading
        console.log(`🔄 Tentativa 1: Carregamento direto do script: ${urlWithVersion}`);
        await this.loadScriptAsPromise(urlWithVersion, false);
        console.log(`✅ Carregamento direto bem-sucedido: ${urlWithVersion}`);
      } catch (error) {
        const directLoadError = error as Error;
        console.warn(`⚠️ Falha no carregamento direto:`, directLoadError);
        
        try {
          // Strategy 2: Module script loading
          console.log(`🔄 Tentativa 2: Carregamento como módulo: ${urlWithVersion}`);
          await this.loadScriptAsPromise(urlWithVersion, true);
          console.log(`✅ Carregamento como módulo bem-sucedido: ${urlWithVersion}`);
        } catch (error) {
          const moduleLoadError = error as Error;
          console.warn(`⚠️ Falha no carregamento como módulo:`, moduleLoadError);
          
          // Strategy 3: Try using proxy if CORS is the issue
          if (directLoadError.toString().includes('CORS') || moduleLoadError.toString().includes('CORS')) {
            // Only attempt proxy if enabled in environment
            if (environment.cors && environment.cors.enableProxy) {
              let proxySuccess = false;
              
              // Try each configured proxy until one works
              const proxyUrls = (environment.cors && environment.cors.proxyUrls) || ['https://cors-anywhere.herokuapp.com/'];
              
              for (const proxyUrl of proxyUrls) {
                if (proxySuccess) break;
                
                try {
                  const corsProxyUrl = `${proxyUrl}${urlWithVersion}`;
                  console.log(`🔄 Tentativa 3: Carregamento via CORS proxy: ${proxyUrl}`);
                  await this.loadScriptAsPromise(corsProxyUrl, false);
                  console.log(`✅ Carregamento via CORS proxy bem-sucedido: ${proxyUrl}`);
                  proxySuccess = true;
                } catch (proxyError) {
                  console.warn(`⚠️ Falha no carregamento via CORS proxy ${proxyUrl}:`, proxyError);
                }
              }
              
              if (!proxySuccess) {
                // Strategy 4: Create script manually with fetch and eval
                try {
                  console.log(`🔄 Tentativa 4: Carregamento manual com fetch e eval`);
                  await this.loadScriptWithFetchAndEval(urlWithVersion, remoteName);
                  console.log(`✅ Carregamento com fetch e eval bem-sucedido`);
                } catch (fetchError) {
                  console.error(`❌ Todas as tentativas de carregamento falharam:`, fetchError);
                  throw new Error(`Falha em todas as tentativas de carregamento do script: ${urlWithVersion}`);
                }
              }
            } else {
              console.warn(`⚠️ Proxy CORS desativado nas configurações. Usando fallback.`);
              await this.loadScriptWithFetchAndEval(urlWithVersion, remoteName);
            }
          } else {
            throw moduleLoadError; // Re-throw if not CORS related
          }
        }
      }
      
      await this.delay(800);
      
      this.logAvailableWindowObjects(remoteName);
    } catch (error) {
      console.error(`❌ Erro no carregamento do script:`, error);
      throw error;
    }
  }
  
  /**
   * Load a script using fetch and eval as a last resort (for CORS issues)
   * This method attempts to load the script content via proxy and then evaluate it
   */
  private static async loadScriptWithFetchAndEval(url: string, remoteName: string): Promise<void> {
    try {
      // Import the CorsProxy utility
      const { CorsProxy } = await import('./cors-proxy');
      
      try {
        console.log(`🔄 Tentando carregar script via proxy e eval: ${url}`);
        
        // Try to fetch the script content via our proxy utility
        const scriptContent = await CorsProxy.fetchWithProxy(url);
        
        if (scriptContent) {
          console.log(`✅ Script obtido via proxy (tamanho: ${scriptContent.length} bytes)`);
          
          // Create a blob from the script content
          const blob = new Blob([scriptContent], { type: 'application/javascript' });
          const objectURL = URL.createObjectURL(blob);
          
          // Load the script from the object URL
          await this.loadScriptAsPromise(objectURL, false);
          
          console.log(`✅ Script carregado via blob: ${objectURL}`);
          URL.revokeObjectURL(objectURL);
          
          return;
        }
      } catch (error) {
        const fetchError = error as Error;
        console.warn(`⚠️ Falha no carregamento via proxy: ${fetchError}`);
      }
      
      // If all else fails, create a mock container as fallback
      const mockContainer = {
        init: () => Promise.resolve(),
        get: () => Promise.resolve(() => ({ 
          default: ModuleUnavailableComponent,
          __isMock: true,
          __remoteName: remoteName
        }))
      };
      
      // Set the mock container on window with different possible names
      const possibleNames = [
        remoteName, 
        `${remoteName}Container`,
        remoteName.replace(/-/g, '_'),
        `${remoteName.replace(/-/g, '_')}Container`,
        `mfe_${remoteName}`,
        `mf_${remoteName}`
      ];
      
      possibleNames.forEach(name => {
        if (!(window as any)[name]) {
          console.log(`⚠️ Criando container mock com nome: ${name}`);
          (window as any)[name] = mockContainer;
        }
      });
      
      console.log(`⚠️ CORS está bloqueando o carregamento. Usando fallback para ${remoteName}`);
      return Promise.resolve();
    } catch (error) {
      console.error(`❌ Erro no carregamento com fetch e eval:`, error);
      throw error;
    }
  }
  
  /**
   * Configura variáveis globais necessárias para o webpack
   */
  private static setupWebpackGlobals(): void {
    if (!(window as any).__webpack_share_scopes__) {
      (window as any).__webpack_share_scopes__ = { default: {} };
    }
    
    if (!(window as any).__webpack_require__) {
      console.log(`⚠️ Criando __webpack_require__ mock para compatibilidade`);
      (window as any).__webpack_require__ = {
        l: (url: string, done: Function) => { 
          console.log(`Mock __webpack_require__.l chamado para ${url}`); 
          done(); 
        },
        f: {},
        r: (id: string) => id,
        e: (chunkId: any) => Promise.resolve({}),
        d: (exports: any, definition: any) => {
          for (const key in definition) {
            Object.defineProperty(exports, key, { 
              enumerable: true, 
              get: definition[key] 
            });
          }
        },
        o: (obj: any, prop: string) => Object.prototype.hasOwnProperty.call(obj, prop),
        u: (chunkId: any) => ""
      };
    }
    
    if (!(window as any).__webpack_init_sharing__) {
      console.log(`⚠️ Criando __webpack_init_sharing__ mock`);
      (window as any).__webpack_init_sharing__ = (scope: string) => {
        console.log(`Mock __webpack_init_sharing__ chamado com ${scope}`);
        return Promise.resolve();
      };
    }
  }
  
  /**
   * Carrega um script como Promise com melhor tratamento de erros
   */
  private static loadScriptAsPromise(url: string, asModule: boolean): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.log(`🔄 Carregando script ${asModule ? 'como módulo' : 'normal'}: ${url}`);
      
      let hasResolved = false;
      let hasRejected = false;
      
      // Capture global errors during loading
      const errorHandler = (event: ErrorEvent) => {
        if (event.filename && event.filename.includes(url)) {
          console.log(`🚨 Global Error durante carregamento: ${event.message || 'null'}`);
          
          if (!hasResolved && !hasRejected) {
            hasRejected = true;
            window.removeEventListener('error', errorHandler);
            reject(new Error(`Global error durante carregamento do script: ${event.message}`));
          }
        }
      };
      
      window.addEventListener('error', errorHandler);
      
      const script = document.createElement('script');
      script.src = url;
      script.type = asModule ? 'module' : 'text/javascript';
      script.crossOrigin = 'anonymous';
      script.async = true;
      
      // Additional attributes that might help with CORS
      script.setAttribute('integrity', '');  // Removing any SRI checks
      script.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      
      script.onerror = (e) => {
        if (!hasResolved && !hasRejected) {
          console.error(`❌ Erro ao carregar script: ${url}`, e);
          hasRejected = true;
          window.removeEventListener('error', errorHandler);
          reject(new Error(`Falha ao carregar script: ${url}`));
        }
      };
      
      script.onload = () => {
        console.log(`✅ Script carregado: ${url}`);
        hasResolved = true;
        window.removeEventListener('error', errorHandler);
        
        // Give a small delay to ensure initialization completes
        setTimeout(() => {
          resolve();
        }, 100);
      };
      
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (!hasResolved && !hasRejected) {
          console.warn(`⌛ Timeout ao carregar script: ${url}`);
          hasRejected = true;
          window.removeEventListener('error', errorHandler);
          reject(new Error(`Timeout ao carregar script: ${url}`));
        }
      }, 30000); // 30 second timeout
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Imprime os objetos disponíveis no window relacionados ao remoteName
   */
  private static logAvailableWindowObjects(remoteName: string): void {
    try {
      console.log(`🔍 Buscando objetos no window relacionados a "${remoteName}":`);
      
      const relevantProps = Object.keys(window).filter(key => 
        key.toLowerCase().includes(remoteName.toLowerCase()) || 
        key.includes('webpack') ||
        key.includes('Container') ||
        key.includes('mfe_') ||
        key.includes('mf_')
      );
      
      console.log('Propriedades encontradas:', relevantProps);
      
      // Additional debug info for containers
      const containerCandidates = relevantProps.filter(key => 
        key.toLowerCase().includes(remoteName.toLowerCase()) ||
        key.includes('Container') ||
        key.includes('mfe_') ||
        key.includes('mf_')
      );
      
      if (containerCandidates.length > 0) {
        console.log(`🔍 Examinando possíveis containers:`);
        containerCandidates.forEach(key => {
          const obj = (window as any)[key];
          console.log(`- ${key}: Tipo: ${typeof obj}, Métodos: ${obj ? Object.keys(obj).join(', ') : 'null'}`);
        });
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao examinar objetos no window:`, error);
    }
  }
  
  /**
   * Initialize the container for Module Federation
   */
  private static async initializeContainer(remoteName: string): Promise<any> {
    const possibleContainerKeys = [
      remoteName,
      `${remoteName}Container`,
      remoteName.replace(/-/g, '_'),
      `${remoteName.replace(/-/g, '_')}Container`,
      `mfe_${remoteName}`,
      `mfe_${remoteName.replace(/-/g, '_')}`,
      `mf_${remoteName}`,
      `mf_${remoteName.replace(/-/g, '_')}`,
      this.toCamelCase(remoteName),
      `${this.toCamelCase(remoteName)}Container`,
      remoteName.toLowerCase(),
      remoteName.toUpperCase()
    ];
    
    console.log(`🔍 Procurando container usando chaves: ${possibleContainerKeys.join(', ')}`);
    
    let container = null;
    let containerKey = '';
    
    for (const key of possibleContainerKeys) {
      if ((window as any)[key]) {
        console.log(`✅ Container encontrado com chave: ${key}`);
        container = (window as any)[key];
        containerKey = key;
        break;
      }
    }
    
    if (!container) {
      console.log(`⚠️ Procurando container por heurística...`);
      
      const windowKeys = Object.keys(window);
      const possibleKey = windowKeys.find(key => 
        key.includes('Container') || 
        key.toLowerCase().includes(remoteName.toLowerCase()) ||
        key.toLowerCase().includes(remoteName.replace(/-/g, '_').toLowerCase())
      );
      
      if (possibleKey) {
        console.log(`✅ Container encontrado por heurística: ${possibleKey}`);
        container = (window as any)[possibleKey];
        containerKey = possibleKey;
      }
    }
    
    if (!container) {
      console.error(`❌ Container não encontrado para: ${remoteName}. Tentativas: ${possibleContainerKeys.join(', ')}`);
      console.log(`⚠️ Criando container de fallback com ModuleUnavailableComponent`);
      
      return {
        init: () => Promise.resolve(),
        get: () => Promise.resolve(() => ({ default: ModuleUnavailableComponent }))
      };
    }
    
    if (!(window as any).__webpack_share_scopes__) {
      (window as any).__webpack_share_scopes__ = { default: {} };
    }
    
    try {
      if (typeof container.init === 'function') {
        try {
          await Promise.resolve(container.init((window as any).__webpack_share_scopes__.default));
          console.log(`✅ Container inicializado via init()`);
        } catch (initError) {
          console.warn(`⚠️ Erro no init() padrão:`, initError);
          
          try {
            await Promise.resolve(container.init());
            console.log(`✅ Container inicializado via init() sem parâmetros`);
          } catch (simpleInitError) {
            console.warn(`⚠️ Erro no init() sem parâmetros:`, simpleInitError);
          }
        }
      } 
      else if (container.initPromise && typeof container.initPromise.then === 'function') {
        await container.initPromise;
        console.log(`✅ Container inicializado via initPromise`);
      }
      else if ((window as any).__webpack_init_sharing__) {
        try {
          await (window as any).__webpack_init_sharing__('default');
          console.log(`✅ Inicializado via __webpack_init_sharing__`);
          
          if (typeof container.init === 'function') {
            await Promise.resolve(container.init((window as any).__webpack_share_scopes__.default));
            console.log(`✅ Container inicializado após __webpack_init_sharing__`);
          }
        } catch (sharingError) {
          console.warn(`⚠️ Erro ao inicializar via __webpack_init_sharing__:`, sharingError);
        }
      }
      else if (typeof container.get === 'function') {
        console.log(`⚠️ Container sem método init mas com get. Assumindo que já está inicializado.`);
      }
      else {
        console.log(`⚠️ Container sem métodos de inicialização conhecidos. Estrutura:`, 
          Object.keys(container).filter(k => typeof k === 'string'));
      }
    } catch (initError) {
      console.warn(`⚠️ Erro geral ao inicializar container, tentando continuar:`, initError);
    }
    
    this.debugContainerStructure(container, containerKey);
    
    return container;
  }
  
  /**
   * Converte string para camelCase (útil para variações de nomes)
   */
  private static toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
  
  /**
   * Imprime a estrutura do container para debug
   */
  private static debugContainerStructure(container: any, containerKey: string): void {
    console.log(`🔍 Estrutura do container ${containerKey}:`);
    
    try {
      const mainMethods = ['init', 'get', 'initPromise'].filter(method => 
        typeof container[method] === 'function' || 
        (method === 'initPromise' && container[method])
      );
      
      console.log(`Métodos principais: ${mainMethods.join(', ') || 'nenhum'}`);
      
      const exposedModules = Object.keys(container).filter(key => 
        typeof container[key] === 'function' || 
        (typeof container[key] === 'object' && container[key] !== null && key !== 'initPromise')
      );
      
      console.log(`Módulos aparentemente expostos: ${exposedModules.join(', ') || 'nenhum'}`);
      
    } catch (error) {
      console.warn(`⚠️ Erro ao analisar estrutura do container:`, error);
    }
  }
  
  /**
   * Retrieve the module factory from the container
   */
  private static async getModuleFactory(container: any, remoteName: string, exposedModule: string): Promise<any> {
    try {
      if (container.get && !container.init && !container.initPromise && 
          typeof container.get === 'function' && 
          typeof container.get.toString === 'function' &&
          container.get.toString().includes('ModuleUnavailableComponent')) {
        return container.get(exposedModule);
      }
      
      if (typeof container.get === 'function') {
        try {
          const factory = await Promise.resolve(container.get(exposedModule));
          console.log(`✅ Módulo obtido via container.get()`);
          return factory;
        } catch (e) {
          console.warn(`⚠️ Erro ao chamar container.get():`, e);
        }
      } 
      
      if (container[exposedModule]) {
        console.log(`✅ Módulo obtido via acesso direto container[exposedModule]`);
        return container[exposedModule];
      }
      
      if (typeof container.init === 'function') {
        try {
          await Promise.resolve(container.init((window as any).__webpack_share_scopes__.default));
          console.log(`✅ Container reinicializado via init() durante getModuleFactory`);
          
          if (typeof container.get === 'function') {
            const factory = await Promise.resolve(container.get(exposedModule));
            console.log(`✅ Módulo obtido via container.get() após reinicialização`);
            return factory;
          } 
          if (container[exposedModule]) {
            console.log(`✅ Módulo obtido via acesso direto após reinicialização`);
            return container[exposedModule];
          }
        } catch (e) {
          console.warn(`⚠️ Erro ao reinicializar container:`, e);
        }
      }
      
      const possibleModules = Object.keys(container).filter(key => 
        typeof container[key] === 'function' || 
        (typeof container[key] === 'object' && container[key] !== null)
      );
      
      console.log(`🔍 Procurando módulo nas propriedades:`, possibleModules);
      
      if (possibleModules.length > 0) {
        const bestMatch = possibleModules.find(key => 
          key.toLowerCase().includes(exposedModule.toLowerCase().replace('./','')) ||
          key.toLowerCase().includes(exposedModule.split('/').pop()?.toLowerCase() || '')
        ) || possibleModules[0];
        
        console.log(`✅ Módulo obtido via fallback: ${bestMatch}`);
        return container[bestMatch];
      } else {
        throw new Error(`Não foi possível encontrar o módulo: ${exposedModule}`);
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
   * Handle module loading errors with improved diagnostics and CORS handling
   */
  private static handleLoadingError(error: any, remoteName: string, exposedModule: string): any {
    console.error(`❌ Erro no carregamento manual de ${remoteName} -> ${exposedModule}:`, error);
    
    // Enhanced CORS error handling
    const errorStr = String(error); // Safe conversion to string
    if (error instanceof Error && (error.message.includes('CORS') || errorStr.includes('CORS'))) {
      console.error(`🔧 DICA: Este erro de CORS indica que o MFE ${remoteName} está configurado para aceitar apenas o domínio de produção.`);
      console.error(`🔧 Para desenvolvimento local, você pode usar uma das seguintes soluções:`);
      console.error(`   1. Configure o MFE ${remoteName} para permitir 'http://localhost:4200' nas configurações de CORS.`);
      console.error(`   2. Use uma extensão de navegador para desabilitar CORS durante desenvolvimento.`);
      console.error(`   3. Configure um proxy local para contornar o CORS.`);
      console.error(`   4. Execute o shell em HTTPS usando 'ng serve --ssl' se o MFE aceitar HTTPS.`);
    }
    
    // Enhanced compatibility error handling
    if (error instanceof Error && (
        error.message.includes('is not a function') || 
        error.message.includes('init is not a function') || 
        error.message.includes('get is not a function')
      )) {
      console.error(`❗ Erro de compatibilidade do Webpack/Module Federation detectado: ${error.message}`);
      console.error(`🔧 Isso geralmente indica diferenças de versão entre o shell e o MFE ${remoteName}.`);
      console.error(`   Certifique-se de que ambos usem versões compatíveis do Angular e Webpack.`);
    }
    
    // Network errors
    if (error instanceof Error && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('Network request failed')
      )) {
      console.error(`🌐 Erro de rede detectado ao carregar ${remoteName}.`);
      console.error(`🔧 Verifique se a URL do MFE está correta e se o serviço está online.`);
      console.error(`   URL atual: ${environment.remoteUrls[remoteName as keyof typeof environment.remoteUrls]}`);
    }
    
    // Return a useful fallback component that will show the error
    return { 
      default: ModuleUnavailableComponent,
      // Additional metadata for the ModuleUnavailableComponent to show
      _errorDetails: {
        remoteName,
        exposedModule,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }
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
