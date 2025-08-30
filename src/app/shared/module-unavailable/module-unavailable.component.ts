import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

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
        <p>O módulo <strong>{{getModuleName()}}</strong> está atualmente em manutenção.</p>
        <p>Estamos trabalhando para restaurar o acesso o mais breve possível.</p>
        <p>Por favor, tente novamente mais tarde ou retorne à página inicial.</p>
        <div class="actions">
          <button class="btn-primary" (click)="goHome()" type="button">Voltar para a Home</button>
          <button class="btn-secondary" (click)="tryReload()" type="button">Tentar Novamente</button>
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
    .btn-primary, .btn-secondary {
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
  `]
})
export class ModuleUnavailableComponent implements OnInit {
  
  constructor(private router: Router) { }
  
  ngOnInit(): void {
    console.log('📍 ModuleUnavailableComponent loaded for path:', window.location.pathname);
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
    }
    
    return 'solicitado';
  }
}
