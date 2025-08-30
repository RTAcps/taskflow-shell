import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoadingService } from './core/services/loading.service';
import { MfeEventService } from './core/services/mfe-event.service';
import { ModuleFederationService } from './core/services/module-federation.service';
import { NotificationService } from './core/services/notification.service';
import { MainLayoutComponent } from './layout/main-layout.component';
import { LoadingComponent } from './shared/loading/loading.component';
import { NotificationComponent } from './shared/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent, LoadingComponent, NotificationComponent],
  template: `
    <app-loading></app-loading>
    <app-notification></app-notification>
    <app-main-layout>
      <router-outlet></router-outlet>
    </app-main-layout>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private routerSubscription: Subscription | undefined;

  constructor(
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly mfeEventService: MfeEventService,
    private readonly notificationService: NotificationService,
    private readonly moduleFederationService: ModuleFederationService
  ) {}

  ngOnInit() {
    this.routerSubscription = this.router.events
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.loadingService.showLoading();
        } else if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
          this.loadingService.hideLoading();
        } else if (event instanceof NavigationError) {
          this.loadingService.hideLoading();
          
          // Verificar se o erro está relacionado com módulos federados
          const errorMessage = event.error?.message || '';
          if (errorMessage.includes('Failed to load remote module')) {
            // Extrair o nome do módulo do URL
            const url = event.url;
            let moduleName = '';
            
            if (url.includes('project-management')) {
              moduleName = 'project-management';
            } else if (url.includes('real-time-collaboration')) {
              moduleName = 'real-time-collaboration';
            } else if (url.includes('analytics-report')) {
              moduleName = 'analytics';
            }
            
            // Navegar para a página de fallback
            if (moduleName) {
              this.moduleFederationService.navigateToFallback(moduleName);
            } else {
              // Fallback genérico
              this.notificationService.showErrorWithRedirect(
                `Não foi possível carregar o módulo solicitado. Você será redirecionado para a página inicial.`,
                '/',
                3000,
                'Erro ao Carregar Módulo'
              );
            }
          } else {
            // Exibir notificação padrão para outros erros de navegação
            this.notificationService.show(
              `Ocorreu um erro ao carregar a página solicitada. Por favor, tente novamente.`,
              'error'
            );
          }
          
          console.error('Erro de navegação:', event.error);
        }
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
