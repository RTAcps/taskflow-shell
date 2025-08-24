import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class MfeEventService {
  constructor(private router: Router) {
    this.setupGlobalEventHandlers();
  }

  private setupGlobalEventHandlers() {
    // Adicionar ao objeto window um método para os MFEs enviarem eventos
    (window as any).mfeNavigate = (path: string) => {
      console.log('[Shell] Received navigation request to:', path);
      this.router.navigateByUrl(path);
      return true;
    };

    // Escutar eventos de navegação dos MFEs
    window.addEventListener('mfe-navigate', ((event: CustomEvent) => {
      if (event.detail && event.detail.path) {
        console.log('[Shell] Caught mfe-navigate event to:', event.detail.path);
        this.router.navigateByUrl(event.detail.path);
      }
    }) as EventListener);
  }
}
