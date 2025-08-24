import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class MfeEventService {
  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.setupGlobalEventHandlers();
  }

  private setupGlobalEventHandlers() {
    // Adicionar ao objeto window um método para os MFEs enviarem eventos
    (window as any).mfeNavigate = (path: string) => {
      console.log('[Shell] Received navigation request to:', path);
      this.router.navigateByUrl(path);
      return true;
    };
    
    // Adicionar método para MFEs reportarem erros
    (window as any).mfeError = (message: string, type: 'warning' | 'error' = 'error', redirectToHome = false, timeout = 0) => {
      console.error('[Shell] Received error from MFE:', message);
      
      if (redirectToHome) {
        // Usar notificação com redirecionamento
        this.notificationService.showErrorWithRedirect(
          message, 
          '/home', 
          timeout > 0 ? timeout : 8000,
          type === 'error' ? 'Erro' : 'Atenção'
        );
      } else {
        // Usar notificação normal
        this.notificationService.show(message, type, timeout > 0 ? timeout : 5000);
      }
      
      return true;
    };

    // Escutar eventos de navegação dos MFEs
    window.addEventListener('mfe-navigate', ((event: CustomEvent) => {
      if (event.detail && event.detail.path) {
        console.log('[Shell] Caught mfe-navigate event to:', event.detail.path);
        this.router.navigateByUrl(event.detail.path);
      }
    }) as EventListener);
    
    // Escutar eventos de erro dos MFEs
    window.addEventListener('mfe-error', ((event: CustomEvent) => {
      if (event.detail && event.detail.message) {
        console.error('[Shell] Caught mfe-error event:', event.detail.message);
        
        if (event.detail.redirectToHome) {
          // Usar notificação com redirecionamento
          this.notificationService.showErrorWithRedirect(
            event.detail.message, 
            '/home',
            event.detail.timeout || 8000,
            event.detail.title || (event.detail.type === 'error' ? 'Erro' : 'Atenção')
          );
        } else {
          // Usar notificação normal
          this.notificationService.show(
            event.detail.message,
            event.detail.type || 'error',
            event.detail.timeout || 5000,
            event.detail.title
          );
        }
      }
    }) as EventListener);
  }
}
