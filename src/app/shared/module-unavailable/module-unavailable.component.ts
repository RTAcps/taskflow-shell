import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-module-unavailable',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="module-unavailable">
      <div class="card">
        <div class="icon-container">
          <i class="pi pi-exclamation-circle error-icon"></i>
        </div>
        <h2>Módulo Temporariamente Indisponível</h2>
        <p>O módulo <strong>{{remoteName || getModuleName()}}</strong> não pôde ser carregado.</p>

        <div class="error-details" *ngIf="showTechnicalDetails">
          <h3>Detalhes técnicos</h3>
          <div class="technical-info">
            <p><strong>MFE:</strong> {{remoteName || 'Desconhecido'}}</p>
            <p><strong>Módulo:</strong> {{exposedModule || 'Desconhecido'}}</p>
            <p><strong>URL:</strong> {{remoteUrl || 'Não disponível'}}</p>
            <p><strong>Erro:</strong> <span class="error-message">{{error || 'Erro desconhecido'}}</span></p>
            <p><strong>Timestamp:</strong> {{timestamp || 'N/A'}}</p>
          </div>
          
          <div class="troubleshooting" *ngIf="isLocalDevelopment">
            <h3>Sugestões para desenvolvimento local</h3>
            <ul>
              <li>Verifique se o MFE está em execução localmente</li>
              <li>Certifique-se de que as versões do Angular e Webpack são compatíveis</li>
              <li>Considere habilitar <code>bypassRemoteLoading: true</code> no environment</li>
              <li>Para MFEs em produção, configure um proxy CORS ou use o modo de compatibilidade</li>
            </ul>
          </div>
        </div>

        <p>Estamos trabalhando para restaurar o acesso o mais breve possível.</p>
        
        <div class="actions">
          <button class="btn-primary" (click)="goHome()" type="button">Voltar para a Home</button>
          <button class="btn-secondary" (click)="tryReload()" type="button">Tentar Novamente</button>
          <button class="btn-info" (click)="toggleTechnicalDetails()" type="button">
            {{ showTechnicalDetails ? 'Ocultar detalhes técnicos' : 'Mostrar detalhes técnicos' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .module-unavailable {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 2rem;
    }
    .card {
      background: var(--surface-card, #ffffff);
      border-radius: 10px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 800px;
      width: 100%;
    }
    .icon-container {
      margin-bottom: 1.5rem;
    }
    .error-icon {
      font-size: 3rem;
      color: var(--orange-500, #f97316);
    }
    h2 {
      color: var(--text-color, #333333);
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    h3 {
      color: var(--text-color, #333333);
      font-size: 1.2rem;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      text-align: left;
    }
    p {
      color: var(--text-color-secondary, #6c757d);
      margin-bottom: 1rem;
    }
    strong {
      color: var(--primary-color, #3B82F6);
    }
    .actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
      flex-wrap: wrap;
    }
    .btn-primary, .btn-secondary, .btn-info {
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      text-decoration: none;
      display: inline-block;
    }
    .btn-primary {
      background: var(--primary-color, #3B82F6);
      color: #ffffff;
    }
    .btn-primary:hover {
      background: var(--primary-600, #2563EB);
    }
    .btn-secondary {
      background: var(--surface-200, #e5e7eb);
      color: var(--text-color, #333333);
    }
    .btn-secondary:hover {
      background: var(--surface-300, #d1d5db);
    }
    .btn-info {
      background: var(--teal-600, #0d9488);
      color: #ffffff;
    }
    .btn-info:hover {
      background: var(--teal-700, #0f766e);
    }
    
    .error-details {
      background: var(--surface-50, #f8fafc);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      text-align: left;
      border: 1px solid var(--surface-200, #e2e8f0);
    }
    
    .technical-info {
      font-family: monospace;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    
    .technical-info p {
      margin-bottom: 0.5rem;
    }
    
    .error-message {
      color: var(--red-600, #dc2626);
      word-break: break-word;
      font-weight: 500;
    }
    
    .troubleshooting {
      margin-top: 1.5rem;
    }
    
    .troubleshooting ul {
      margin: 0;
      padding-left: 1.5rem;
      list-style-type: disc;
      text-align: left;
    }
    
    .troubleshooting li {
      margin-bottom: 0.5rem;
      color: var(--text-color-secondary, #6c757d);
    }
    
    code {
      font-family: monospace;
      background-color: var(--surface-100, #f1f5f9);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }
  `]
})
export class ModuleUnavailableComponent implements OnInit {
  @Input() remoteName?: string;
  @Input() exposedModule?: string;
  @Input() error?: string;
  @Input() timestamp?: string;
  @Input() isLocalDevelopment?: boolean;
  @Input() remoteUrl?: string;
  
  showTechnicalDetails = false;
  
  constructor(private router: Router) { }
  
  ngOnInit(): void {
    console.log('📍 ModuleUnavailableComponent loaded for path:', window.location.pathname);
    
    // Auto-detect local development if not explicitly set
    if (this.isLocalDevelopment === undefined) {
      this.isLocalDevelopment = window.location.hostname === 'localhost';
    }
    
    // In development mode, show technical details by default
    if (this.isLocalDevelopment && !environment.production) {
      this.showTechnicalDetails = true;
    }
    
    // Extrair informações do _errorDetails se disponível
    if (this.remoteName === undefined && (window as any)._mfeErrorDetails) {
      const errorDetails = (window as any)._mfeErrorDetails;
      this.remoteName = errorDetails.remoteName;
      this.exposedModule = errorDetails.exposedModule;
      this.error = errorDetails.error;
      this.timestamp = errorDetails.timestamp;
      this.remoteUrl = errorDetails.remoteUrl;
      this.isLocalDevelopment = errorDetails.isLocalDevelopment;
    }
  }
  
  /**
   * Navigate to home page
   */
  goHome(): void {
    console.log('🏠 Navigating to home');
    this.router.navigate(['/']);
  }
  
  /**
   * Reload the current page
   */
  tryReload(): void {
    console.log('🔄 Reloading page');
    window.location.reload();
  }
  
  /**
   * Toggle technical details visibility
   */
  toggleTechnicalDetails(): void {
    this.showTechnicalDetails = !this.showTechnicalDetails;
  }
  
  /**
   * Get a user-friendly name for the module based on the current route
   */
  getModuleName(): string {
    const path = window.location.pathname;
    
    if (path.includes('project-management')) {
      return 'Gerenciamento de Projetos';
    } else if (path.includes('real-time-collaboration')) {
      return 'Colaboração em Tempo Real';
    } else if (path.includes('analytics-report')) {
      return 'Relatórios de Análise';
    } else if (path.includes('kanban')) {
      return 'Kanban';
    } else if (path.includes('calendar')) {
      return 'Calendário';
    } else if (path.includes('dashboard')) {
      return 'Dashboard';
    }
    
    return 'solicitado';
  }
}
