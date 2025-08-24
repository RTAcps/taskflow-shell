import { Injectable } from '@angular/core';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { LoadingService } from './loading.service';
import { from, Observable, of, throwError, timer } from 'rxjs';
import { catchError, finalize, map, race, tap, timeout } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RemoteModuleService {
  // Tempo máximo de espera para carregar um módulo remoto (1 minuto)
  private readonly MAX_LOAD_TIME = 60000; 

  constructor(
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  loadComponent<T>(remoteEntry: string, exposedModule: string, componentAccessor: (module: any) => T): Observable<T> {
    this.loadingService.showLoading();
    
    return from(
      loadRemoteModule({
        type: 'module',
        remoteEntry: remoteEntry,
        exposedModule: exposedModule
      })
    ).pipe(
      // Adiciona um timeout para evitar espera indefinida
      timeout(this.MAX_LOAD_TIME),
      map(m => componentAccessor(m)),
      catchError(error => {
        console.error(`Erro ao carregar o módulo remoto: ${exposedModule}`, error);
        
        const isTimeoutError = error.name === 'TimeoutError';
        const errorMessage = isTimeoutError
          ? `O módulo está demorando muito para responder. Você será redirecionado para a página inicial em instantes.`
          : `O módulo solicitado não está disponível no momento. Por favor, tente novamente mais tarde.`;
        
        // Usar o SweetAlert2 para mostrar o erro com redirecionamento
        this.notificationService.showErrorWithRedirect(
          errorMessage,
          '/home',
          isTimeoutError ? 5000 : 8000,
          isTimeoutError ? 'Tempo esgotado' : 'Erro ao carregar módulo'
        );
        
        return of(null as unknown as T);
      }),
      finalize(() => this.loadingService.hideLoading())
    );
  }
}
