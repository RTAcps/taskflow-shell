import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-mfe-diagnostics',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="diagnostics-container">
      <h2>Diagnóstico de Módulos Federados</h2>
      
      <div class="section">
        <h3>Ambiente</h3>
        <div class="info-row">
          <span>Modo Produção:</span>
          <span>{{ environment.production ? 'Sim' : 'Não' }}</span>
        </div>
        <div class="info-row">
          <span>Navegador:</span>
          <span>{{ navigator.userAgent }}</span>
        </div>
        <div class="info-row">
          <span>Webpack:</span>
          <span>{{ webpackDetails }}</span>
        </div>
      </div>
      
      <div class="section">
        <h3>URLs Remotas Configuradas</h3>
        <div class="actions">
          <button (click)="recheckUrls()">Verificar Todas URLs</button>
          <button (click)="testAllRemotes()">Testar Todos Remotes</button>
          <button (click)="testLoadWithModuleFederation()">Testar loadRemoteModule</button>
        </div>
        
        <div class="info-row" *ngFor="let url of remoteUrls">
          <span>{{ url.name }}:</span>
          <div class="url-status">
            <span>{{ url.url }}</span>
            <span class="status" [class.status-ok]="url.status === 200" [class.status-error]="url.status !== 200">
              {{ url.status === 200 ? '✓ Acessível' : '✗ Inacessível' }} 
              {{ url.loading ? '(verificando...)' : '' }}
            </span>
            <button (click)="testRemote(url.name)" [disabled]="url.loading">
              {{ url.loading ? 'Testando...' : 'Testar Carregamento' }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="section" *ngIf="federationTestResults.length > 0">
        <h3>Testes com loadRemoteModule</h3>
        <div class="test-results">
          <div class="test-result" *ngFor="let result of federationTestResults" [class.test-success]="result.success" [class.test-error]="!result.success">
            <div class="test-header">
              <span>{{ result.remoteName }} - {{ result.exposedModule }}</span>
              <span>{{ result.success ? '✓ Sucesso' : '✗ Falha' }}</span>
            </div>
            <div class="test-details">
              <pre>{{ result.details }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <div class="section" *ngIf="testResults.length > 0">
        <h3>Resultados de Testes com import()</h3>
        <div class="test-results">
          <div class="test-result" *ngFor="let result of testResults" [class.test-success]="result.success" [class.test-error]="!result.success">
            <div class="test-header">
              <span>{{ result.remoteName }}</span>
              <span>{{ result.success ? '✓ Sucesso' : '✗ Falha' }}</span>
            </div>
            <div class="test-details">
              <pre>{{ result.details }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h3>Verificação do Webpack __webpack_share_scopes__</h3>
        <button (click)="checkWebpackShareScopes()">Verificar Share Scopes</button>
        <div *ngIf="shareScopes" class="mt-10">
          <pre>{{ shareScopes }}</pre>
        </div>
      </div>
      
      <div class="section">
        <h3>Verificação do init_sharing</h3>
        <button (click)="checkWebpackInitSharing()">Testar __webpack_init_sharing__</button>
        <div *ngIf="initSharingResult" class="mt-10">
          <div [class]="initSharingSuccess ? 'text-success' : 'text-error'">
            {{ initSharingResult }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .diagnostics-container {
      font-family: 'Inter', sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    h2 {
      color: #2c3e50;
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    h3 {
      color: #495057;
      margin-bottom: 15px;
      font-weight: 600;
    }
    
    .info-row {
      display: flex;
      border-bottom: 1px solid #e9ecef;
      padding: 8px 0;
    }
    
    .info-row > span:first-child {
      font-weight: 500;
      width: 200px;
      color: #495057;
    }
    
    .url-status {
      display: flex;
      flex-grow: 1;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
    }
    
    .status {
      margin-left: 10px;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .status-ok {
      background-color: #d4edda;
      color: #155724;
    }
    
    .status-error {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    button {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 5px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
      margin-bottom: 10px;
    }
    
    button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
    
    button:not(:disabled):hover {
      background-color: #0069d9;
    }
    
    .actions {
      margin-bottom: 15px;
    }
    
    .test-results {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .test-result {
      border-radius: 4px;
      overflow: hidden;
    }
    
    .test-success {
      border-left: 4px solid #28a745;
    }
    
    .test-error {
      border-left: 4px solid #dc3545;
    }
    
    .test-header {
      display: flex;
      justify-content: space-between;
      padding: 10px 15px;
      background-color: #e9ecef;
      font-weight: 500;
    }
    
    .test-details {
      padding: 10px 15px;
      background-color: #f1f3f5;
    }
    
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
      font-size: 13px;
      font-family: monospace;
    }
    
    .mt-10 {
      margin-top: 10px;
    }
    
    .text-success {
      color: #28a745;
    }
    
    .text-error {
      color: #dc3545;
    }
  `]
})
export class MfeDiagnosticsComponent implements OnInit {
  environment = environment;
  remoteUrls: {name: string, url: string, status: number, loading?: boolean}[] = [];
  testResults: {remoteName: string, success: boolean, details: string}[] = [];
  federationTestResults: {remoteName: string, exposedModule: string, success: boolean, details: string}[] = [];
  navigator = window.navigator;
  webpackDetails = 'Verificando...';
  shareScopes: string | null = null;
  initSharingResult: string | null = null;
  initSharingSuccess = false;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.checkWebpackInfo();
    this.recheckUrls().catch(err => {
      console.error('Erro ao verificar URLs remotas:', err);
    });
  }
  
  checkWebpackInfo() {
    try {
      // @ts-ignore
      const hasWebpack = typeof window.__webpack_require__ !== 'undefined';
      // @ts-ignore
      const hasShareScopes = typeof window.__webpack_share_scopes__ !== 'undefined';
      // @ts-ignore
      const hasInitSharing = typeof window.__webpack_init_sharing__ !== 'undefined';
      
      this.webpackDetails = `Webpack: ${hasWebpack ? 'Disponível' : 'Não encontrado'}, ` +
                           `Share Scopes: ${hasShareScopes ? 'Disponível' : 'Não encontrado'}, ` +
                           `Init Sharing: ${hasInitSharing ? 'Disponível' : 'Não encontrado'}`;
    } catch (error) {
      this.webpackDetails = `Erro ao verificar Webpack: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  
  async recheckUrls() {
    this.remoteUrls = [];
    // Obter URLs remotas do ambiente
    const remotes = environment.remoteUrls;
    
    // Verificar status de cada URL remota
    for (const [name, url] of Object.entries(remotes)) {
      try {
        const urlStr = url as string;
        const response = await fetch(urlStr, { 
          method: 'HEAD',
          // Garantir que a requisição não seja bloqueada por CORS durante os testes
          mode: 'no-cors'
        });
        
        this.remoteUrls.push({
          name,
          url: urlStr,
          status: 200 // Se não lançar erro com no-cors, assumimos que está OK
        });
      } catch (error) {
        // Com no-cors, raramente chegamos aqui a menos que o servidor esteja inacessível
        console.error(`Erro ao verificar URL ${name}:`, error);
        this.remoteUrls.push({
          name,
          url: url as string,
          status: 0
        });
      }
    }
  }

  async testAllRemotes() {
    for (const remote of this.remoteUrls) {
      await this.testRemote(remote.name);
    }
  }

  async testRemote(remoteName: string) {
    console.log(`🧪 Testando carregamento do MFE: ${remoteName}`);
    
    // Marcar como carregando
    const remoteIndex = this.remoteUrls.findIndex(r => r.name === remoteName);
    if (remoteIndex >= 0) {
      this.remoteUrls[remoteIndex] = { ...this.remoteUrls[remoteIndex], loading: true };
    }
    
    try {
      let moduleResult: Record<string, any>;
      let exposedModule = './Module';
      
      // Determinar qual módulo exposto usar com base no remoteName
      if (remoteName === 'taskflow-component') {
        exposedModule = './ProjectListComponent';
      } else if (remoteName === 'taskflow-reactive') {
        exposedModule = './RealTimeCollaborationComponent';
      }
      
      // Usar loadRemoteModule para todos os MFEs
      moduleResult = await loadRemoteModule({
        type: 'module',
        remoteEntry: environment.remoteUrls[remoteName],
        exposedModule: exposedModule
      });
      
      // Se não houver resultado, lançar erro
      if (!moduleResult) {
        throw new Error(`Nenhum módulo retornado para ${remoteName}`);
      }
      
      console.log(`✅ Módulo ${remoteName} carregado com sucesso:`, moduleResult);
      
      const keys = Object.keys(moduleResult);
      const hasDefault = 'default' in moduleResult;
      const keyDetails = keys.map(key => `${key}: ${typeof (moduleResult as Record<string, any>)[key]}`).join('\n');
      
      this.testResults.unshift({
        remoteName,
        success: true,
        details: `Módulo carregado com sucesso.\n\nExportações (${keys.length}):\n${keyDetails}\n\nDefault Export: ${hasDefault ? 'Sim' : 'Não'}`
      });
    } catch (error) {
      console.error(`❌ Erro ao carregar módulo ${remoteName}:`, error);
      
      this.testResults.unshift({
        remoteName,
        success: false,
        details: `Erro: ${error instanceof Error ? error.message : JSON.stringify(error)}\n\nStack: ${error instanceof Error ? error.stack : 'Não disponível'}`
      });
    } finally {
      // Desmarcar o carregando
      const updatedRemoteIndex = this.remoteUrls.findIndex(r => r.name === remoteName);
      if (updatedRemoteIndex >= 0) {
        this.remoteUrls[updatedRemoteIndex] = { ...this.remoteUrls[updatedRemoteIndex], loading: false };
      }
    }
  }
  
  async testLoadWithModuleFederation() {
    const testModules = [
      { name: 'taskflow-component', exposedModule: './ProjectListComponent' },
      { name: 'taskflow-reactive', exposedModule: './RealTimeCollaborationComponent' },
      { name: 'taskflow-functional', exposedModule: './Module' }
    ];
    
    for (const module of testModules) {
      try {
        console.log(`🧪 Testando loadRemoteModule para ${module.name} - ${module.exposedModule}`);
        
        const m = await loadRemoteModule({
          type: 'module',
          remoteEntry: environment.remoteUrls[module.name] as string,
          exposedModule: module.exposedModule
        });
        
        console.log(`✅ Módulo ${module.name}/${module.exposedModule} carregado:`, m);
        
        const keys = Object.keys(m);
        const hasDefault = 'default' in m;
        const keyDetails = keys.map(key => `${key}: ${typeof m[key]}`).join('\n');
        
        this.federationTestResults.unshift({
          remoteName: module.name,
          exposedModule: module.exposedModule,
          success: true,
          details: `Módulo carregado com sucesso via loadRemoteModule.\n\nExportações (${keys.length}):\n${keyDetails}\n\nDefault Export: ${hasDefault ? 'Sim' : 'Não'}`
        });
      } catch (error) {
        console.error(`❌ Erro ao carregar ${module.name}/${module.exposedModule}:`, error);
        
        this.federationTestResults.unshift({
          remoteName: module.name,
          exposedModule: module.exposedModule,
          success: false,
          details: `Erro: ${error instanceof Error ? error.message : JSON.stringify(error)}\n\nStack: ${error instanceof Error ? error.stack : 'Não disponível'}`
        });
      }
    }
  }
  
  checkWebpackShareScopes() {
    try {
      // @ts-ignore
      const scopes = window.__webpack_share_scopes__;
      if (scopes) {
        // Converter o objeto em uma string formatada para mostrar na interface
        const scopesStr = JSON.stringify(scopes, (key, value) => {
          if (typeof value === 'function') {
            return '[Function]';
          }
          return value;
        }, 2);
        
        this.shareScopes = scopesStr;
      } else {
        this.shareScopes = "window.__webpack_share_scopes__ não encontrado";
      }
    } catch (error) {
      this.shareScopes = `Erro ao acessar __webpack_share_scopes__: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  
  checkWebpackInitSharing() {
    try {
      // @ts-ignore
      const initSharing = window.__webpack_init_sharing__;
      if (initSharing && typeof initSharing === 'function') {
        // Tente executar a função
        initSharing('default');
        this.initSharingResult = "__webpack_init_sharing__('default') executado com sucesso";
        this.initSharingSuccess = true;
      } else {
        this.initSharingResult = "window.__webpack_init_sharing__ não encontrado ou não é uma função";
        this.initSharingSuccess = false;
      }
    } catch (error) {
      this.initSharingResult = `Erro ao executar __webpack_init_sharing__: ${error instanceof Error ? error.message : String(error)}`;
      this.initSharingSuccess = false;
    }
  }
}
