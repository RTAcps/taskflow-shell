
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
      
      // Detecta se estamos em modo local acessando MFEs em produção
      const isLocalAccessingProd = window.location.hostname === 'localhost' && remoteUrl.includes('netlify.app');
      
      if (isLocalAccessingProd && environment.bypassRemoteLoading) {
        // Se estamos em localhost acessando um MFE em produção e bypassRemoteLoading está habilitado,
        // usamos o mock diretamente
        console.log(`⚠️ Modo de compatibilidade: Carregando módulo simulado para ${remoteName} em ambiente local`);
        await this.createMockContainer(remoteName);
        return;
      }
      
      // Se forceManualLoad estiver habilitado, tentamos o carregamento ESM primeiro
      if (environment.forceManualLoad && environment.esmCompatMode) {
        console.log(`🔄 Tentativa especial: Carregando como ESM com compatibilidade total: ${urlWithVersion}`);
        try {
          await this.loadEsmModuleWithCompatibility(urlWithVersion, remoteName);
          console.log(`✅ Carregamento ESM com compatibilidade iniciado: ${remoteName}`);
          return;
        } catch (esmError) {
          console.warn(`⚠️ Falha no carregamento ESM com compatibilidade:`, esmError);
          // Continua com outros métodos de carregamento
        }
      }
      
      // Try different loading strategies in sequence
      try {
        // Strategy 1: Direct script loading
        console.log(`🔄 Tentativa 1: Carregamento direto do script: ${urlWithVersion}`);
        await this.loadScriptAsPromise(urlWithVersion, false);
        console.log(`✅ Carregamento direto bem-sucedido: ${urlWithVersion}`);
      } catch (error) {
        const directLoadError = error as Error;
        console.warn(`⚠️ Falha no carregamento direto:`, directLoadError);
        
        // Verificar se o erro é relacionado a "import.meta"
        const isImportMetaError = directLoadError.toString().includes('import.meta');
        const isESMError = isImportMetaError || directLoadError.toString().includes('outside a module');
        
        if (isESMError) {
          // Para erros de import.meta e ESM, tentamos carregar com várias estratégias
          try {
            console.log(`🔄 Tentativa especial: Carregando com estratégia de compatibilidade ESM: ${urlWithVersion}`);
            
            // Primeiro, configuramos polyfills e variáveis necessárias para ESM
            const compatScript = document.createElement('script');
            compatScript.textContent = `
              // Polyfill para import.meta
              if (typeof window.importMeta === 'undefined') {
                window.importMeta = { url: '${window.location.origin}' };
              }
              
              // Variáveis globais para compatibilidade
              window.__LOCAL_DEV_MFE_COMPAT__ = true;
              
              // Suporte para g não iterável
              try {
                window.__webpack_require__ = window.__webpack_require__ || {};
                window.__webpack_share_scopes__ = window.__webpack_share_scopes__ || {};
              } catch(e) { console.warn("Erro ao configurar ambiente webpack:", e); }
            `;
            document.head.appendChild(compatScript);
            
            // Então carregamos o script como módulo
            const script = document.createElement('script');
            script.type = 'module';
            script.crossOrigin = 'anonymous';
            script.src = urlWithVersion;
            script.onerror = (e) => console.error("Erro ao carregar módulo ESM:", e);
            document.head.appendChild(script);
            
            // Criamos um mock container enquanto aguarda o carregamento do módulo
            await this.createMockContainer(remoteName);
            console.log(`✅ Fallback para módulo ESM configurado com compatibilidade estendida: ${remoteName}`);
            return;
          } catch (esmError) {
            console.warn(`⚠️ Falha no carregamento com estratégia de compatibilidade ESM:`, esmError);
          }
        }
        
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
                  const corsProxyUrl = `${proxyUrl}${encodeURIComponent(urlWithVersion)}`;
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
                  await this.createMockContainer(remoteName);
                  console.log(`⚠️ Usando container mock para ${remoteName}`);
                }
              }
            } else {
              console.warn(`⚠️ Proxy CORS desativado nas configurações. Usando fallback.`);
              await this.createMockContainer(remoteName);
            }
          } else {
            // Se não for CORS, tente um fallback
            console.warn(`⚠️ Problema não relacionado a CORS. Usando fallback.`);
            await this.createMockContainer(remoteName);
          }
        }
      }
      
      await this.delay(800);
      
      this.logAvailableWindowObjects(remoteName);
    } catch (error) {
      console.error(`❌ Erro no carregamento do script:`, error);
      // Última tentativa - criar um container mock
      await this.createMockContainer(remoteName);
    }
  }
  
  /**
   * Creates a mock container for a remote module
   */
  private static async createMockContainer(remoteName: string): Promise<void> {
    console.log(`🔧 Criando container mock para ${remoteName}`);
    
    // Container mock com métodos necessários
    const mockContainer = {
      init: (shareScope: any) => {
        console.log(`Mock container ${remoteName}.init() chamado com:`, shareScope);
        return Promise.resolve();
      },
      get: (module: string) => {
        console.log(`Mock container ${remoteName}.get(${module}) chamado`);
        return Promise.resolve(() => ({ 
          default: ModuleUnavailableComponent,
          __isMock: true,
          __remoteName: remoteName,
          __moduleName: module
        }));
      }
    };
    
    // Possíveis nomes para o container
    const possibleNames = [
      remoteName, 
      `${remoteName}Container`,
      remoteName.replace(/-/g, '_'),
      `${remoteName.replace(/-/g, '_')}Container`,
      `mfe_${remoteName}`,
      `mf_${remoteName}`,
      `webpackChunk${remoteName.replace(/-/g, '_')}`
    ];
    
    // Registrar o container mock em todos os possíveis nomes
    possibleNames.forEach(name => {
      if (!(window as any)[name]) {
        console.log(`🔧 Registrando container mock como ${name}`);
        (window as any)[name] = mockContainer;
      } else {
        console.log(`⚠️ Container já existe para ${name}, estendendo...`);
        const existingContainer = (window as any)[name];
        
        // Se existir mas não tiver os métodos necessários, adiciona-os
        if (!existingContainer.get || typeof existingContainer.get !== 'function') {
          existingContainer.get = mockContainer.get;
        }
        
        if (!existingContainer.init || typeof existingContainer.init !== 'function') {
          existingContainer.init = mockContainer.init;
        }
      }
    });
    
    return Promise.resolve();
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
      // Garantir que o objeto de compartilhamento está configurado corretamente
      if (!(window as any).__webpack_share_scopes__) {
        (window as any).__webpack_share_scopes__ = { default: {} };
      }
      
      // Para lidar com erro "g is not iterable", adiciona polyfills específicos
      try {
        // Verificar se Symbol.iterator está disponível (pode não estar em alguns ambientes)
        const hasSymbolIterator = typeof Symbol !== 'undefined' && Symbol.iterator;
        
        // Criar um objeto de compartilhamento simplificado
        const safeShareScope: any = {
          // Essencial para não dar "g is not iterable"
          get: function(module: string) { 
            return (window as any).__webpack_share_scopes__.default[module] || {}; 
          },
          init: function() { return Promise.resolve(); }
        };
        
        // Adicionar Symbol.iterator apenas se disponível
        if (hasSymbolIterator) {
          safeShareScope[Symbol.iterator] = function*() { 
            yield* Object.entries((window as any).__webpack_share_scopes__.default); 
          };
        }
        
        // Atualiza o escopo de compartilhamento com os polyfills
        (window as any).__webpack_share_scopes__.default = {
          ...(window as any).__webpack_share_scopes__.default,
          ...safeShareScope
        };
      } catch (e) {
        console.warn('⚠️ Falha ao configurar polyfills para "g is not iterable":', e);
      }

      if (typeof container.init === 'function') {
        try {
          // Tenta inicializar com tratamento especial para "g is not iterable"
          const shareScope = (window as any).__webpack_share_scopes__.default;
          
          try {
            console.log(`🔄 Inicializando container via init() com escopo seguro`);
            await Promise.resolve(container.init(shareScope));
            console.log(`✅ Container inicializado via init()`);
          } catch (initError) {
            const errorStr = String(initError);
            
            // Tratamento específico para o erro "g is not iterable"
            if (errorStr.includes('is not iterable')) {
              console.warn(`⚠️ Detectado erro "g is not iterable", tentando inicialização alternativa`);
              
              // Versão simplificada do escopo de compartilhamento
              const simpleShareScope = { default: {} };
              
              try {
                await Promise.resolve(container.init(simpleShareScope));
                console.log(`✅ Container inicializado via init() com escopo simples`);
              } catch (simpleError) {
                // Última tentativa - sem parâmetros
                await Promise.resolve(container.init());
                console.log(`✅ Container inicializado via init() sem parâmetros`);
              }
            } else {
              console.warn(`⚠️ Erro no init() padrão:`, initError);
              
              // Tentativa sem parâmetros
              await Promise.resolve(container.init());
              console.log(`✅ Container inicializado via init() sem parâmetros`);
            }
          }
        } catch (allInitError) {
          console.warn(`⚠️ Todas as tentativas de init() falharam:`, allInitError);
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
            try {
              await Promise.resolve(container.init((window as any).__webpack_share_scopes__.default));
              console.log(`✅ Container inicializado após __webpack_init_sharing__`);
            } catch (postShareError) {
              console.warn(`⚠️ Erro após __webpack_init_sharing__:`, postShareError);
            }
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
    
    // Log apenas as chaves do módulo para evitar problemas de serialização circular
    try {
      const moduleKeys = module ? Object.keys(module) : [];
      console.log(`✅ Módulo carregado com sucesso:`, moduleKeys);
    } catch (e) {
      console.log(`✅ Módulo carregado com sucesso (não serializado)`);
    }
    
    return module;
  }
  
  /**
   * Handle module loading errors with improved diagnostics and CORS handling
   */
  private static handleLoadingError(error: any, remoteName: string, exposedModule: string): any {
    console.error(`❌ Erro no carregamento manual de ${remoteName} -> ${exposedModule}:`, error);
    
    const errorStr = String(error); // Safe conversion to string
    
    // import.meta error handling (common in production builds using ESM)
    if (errorStr.includes('import.meta') || errorStr.includes('outside a module')) {
      console.error(`🔧 Erro de import.meta detectado: Este erro ocorre quando um módulo ESM é carregado como script regular.`);
      console.error(`🔧 Solução 1: Verifique se o MFE ${remoteName} está configurado para usar Module Federation compatível com ESM.`);
      console.error(`🔧 Solução 2: Use o atributo type="module" ao carregar o remoteEntry.js.`);
      console.error(`🔧 Solução 3: Em ambiente de desenvolvimento local, prefira executar todos os MFEs localmente.`);
    }
    
    // "g is not iterable" error handling (common in Module Federation incompatibility)
    if (errorStr.includes('is not iterable')) {
      console.error(`🔧 Erro de compatibilidade: "is not iterable" geralmente indica incompatibilidade de versões do Webpack.`);
      console.error(`🔧 Solução 1: Alinhe as versões do Webpack entre o shell e o MFE ${remoteName}.`);
      console.error(`🔧 Solução 2: Em ambiente de desenvolvimento local, habilite a opção bypassRemoteLoading no environment.`);
    }
    
    // Enhanced CORS error handling
    if (errorStr.includes('CORS')) {
      console.error(`🔧 DICA: Este erro de CORS indica que o MFE ${remoteName} está configurado para aceitar apenas o domínio de produção.`);
      console.error(`🔧 Para desenvolvimento local, você pode usar uma das seguintes soluções:`);
      console.error(`   1. Configure o MFE ${remoteName} para permitir 'http://localhost:4200' nas configurações de CORS.`);
      console.error(`   2. Use uma extensão de navegador para desabilitar CORS durante desenvolvimento.`);
      console.error(`   3. Configure um proxy local para contornar o CORS.`);
      console.error(`   4. Execute o shell em HTTPS usando 'ng serve --ssl' se o MFE aceitar HTTPS.`);
      console.error(`   5. Adicione "bypassRemoteLoading: true" no environment para usar componentes mock em desenvolvimento.`);
    }
    
    // Enhanced compatibility error handling
    if (errorStr.includes('is not a function') || 
        errorStr.includes('init is not a function') || 
        errorStr.includes('get is not a function')) {
      console.error(`❗ Erro de compatibilidade do Webpack/Module Federation detectado: ${errorStr}`);
      console.error(`🔧 Isso geralmente indica diferenças de versão entre o shell e o MFE ${remoteName}.`);
      console.error(`   Certifique-se de que ambos usem versões compatíveis do Angular e Webpack.`);
    }
    
    // Network errors
    if (errorStr.includes('Failed to fetch') || 
        errorStr.includes('NetworkError') ||
        errorStr.includes('Network request failed')) {
      console.error(`🌐 Erro de rede detectado ao carregar ${remoteName}.`);
      console.error(`🔧 Verifique se a URL do MFE está correta e se o serviço está online.`);
      console.error(`   URL atual: ${environment.remoteUrls[remoteName as keyof typeof environment.remoteUrls]}`);
    }
    
    // Local vs Production mismatch
    if (window.location.hostname === 'localhost' && 
        environment.remoteUrls[remoteName as keyof typeof environment.remoteUrls]?.includes('netlify.app')) {
      console.error(`⚠️ Detectada tentativa de carregar MFE de produção em ambiente local.`);
      console.error(`🔧 Recomendação: Para desenvolvimento, execute os MFEs localmente ou use bypassRemoteLoading.`);
    }
    
    // Return a useful fallback component that will show the error
    return { 
      default: ModuleUnavailableComponent,
      // Additional metadata for the ModuleUnavailableComponent to show
      _errorDetails: {
        remoteName,
        exposedModule,
        error: errorStr,
        timestamp: new Date().toISOString(),
        isLocalDevelopment: window.location.hostname === 'localhost',
        remoteUrl: environment.remoteUrls[remoteName as keyof typeof environment.remoteUrls]
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
  
  /**
   * Carrega um módulo ESM com compatibilidade especial para ambientes mistos
   * Esta abordagem funciona melhor para MFEs em produção com import.meta
   */
  private static async loadEsmModuleWithCompatibility(url: string, remoteName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log(`🔄 Carregando módulo ESM com compatibilidade: ${url}`);
        
        // 1. Primeiro, configura polyfills e proxies necessários
        // Prevenir erro de import.meta
        if (typeof (window as any).importMeta === 'undefined') {
          (window as any).importMeta = { url: window.location.origin };
        }
        
        // Prevenir erro de iteração (i.forEach is not a function)
        const originalForEach = Array.prototype.forEach;
        
        // Usamos arrow function para evitar problemas com 'this'
        const safeForEach = function(
          this: any[], 
          callback: (value: any, index: number, array: any[]) => void, 
          thisArg?: any
        ) {
          // Garantir que estamos chamando forEach em um array
          if (!Array.isArray(this)) {
            console.warn('⚠️ forEach chamado em um não-array, tentando converter:', this);
            try {
              const arr = Array.from(Object(this));
              return originalForEach.call(arr, callback, thisArg);
            } catch (e) {
              console.warn('⚠️ Não foi possível converter para array:', e);
              // Fallback: iterar com um for...in loop
              const obj = Object(this);
              const keys = Object.keys(obj);
              for (let i = 0; i < keys.length; i++) {
                callback.call(thisArg, obj[keys[i]], i, obj);
              }
              return undefined;
            }
          }
          return originalForEach.call(this, callback, thisArg);
        };
        
        // Guardar a referência original para restaurar depois
        const originalArrayForEach = Array.prototype.forEach;
        
        // Substituir temporariamente para usar nossa versão segura
        Array.prototype.forEach = safeForEach as any;
        
        // 2. Criar tag de script com type="module"
        const script = document.createElement('script');
        script.type = 'module';
        script.crossOrigin = 'anonymous';
        script.src = url;
        
        script.onload = async () => {
          console.log(`✅ Módulo ESM carregado: ${url}`);
          
          // Restaurar o forEach original após o carregamento
          Array.prototype.forEach = originalArrayForEach;
          
          // Dar tempo para inicialização
          await this.delay(1000);
          
          // Verificar se o container foi carregado
          const containerFound = this.checkForContainer(remoteName);
          if (!containerFound) {
            console.warn(`⚠️ Container não detectado após carregamento ESM, criando mock para ${remoteName}`);
            await this.createMockContainer(remoteName);
          }
          
          resolve();
        };
        
        script.onerror = (e) => {
          console.error(`❌ Erro ao carregar módulo ESM: ${url}`, e);
          
          // Restaurar o forEach original após erro
          Array.prototype.forEach = originalArrayForEach;
          
          reject(new Error(`Falha ao carregar módulo ESM: ${url}`));
        };
        
        // 3. Adicionar o script ao documento
        document.head.appendChild(script);
        
        // 4. Definir um timeout de segurança
        setTimeout(() => {
          const containerFound = this.checkForContainer(remoteName);
          if (!containerFound) {
            console.warn(`⚠️ Timeout no carregamento ESM, tentando criar container mock para ${remoteName}`);
            this.createMockContainer(remoteName)
              .then(() => resolve())
              .catch(err => reject(err));
          } else {
            resolve();
          }
        }, 5000);
      } catch (error) {
        console.error(`❌ Erro na configuração do carregamento ESM:`, error);
        reject(error);
      }
    });
  }
  
  /**
   * Verifica se o container para o MFE foi carregado
   */
  private static checkForContainer(remoteName: string): boolean {
    const possibleNames = [
      remoteName, 
      `${remoteName}Container`,
      remoteName.replace(/-/g, '_'),
      `${remoteName.replace(/-/g, '_')}Container`,
      `mfe_${remoteName}`,
      `mf_${remoteName}`,
      `webpackChunk${remoteName.replace(/-/g, '_')}`,
      this.toCamelCase(remoteName),
      `${this.toCamelCase(remoteName)}Container`,
      remoteName.toLowerCase(),
      remoteName.toUpperCase()
    ];
    
    return possibleNames.some(name => {
      const obj = (window as any)[name];
      return obj && (typeof obj.get === 'function' || typeof obj.init === 'function');
    });
  }
}
