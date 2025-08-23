import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoadingService } from './core/services/loading.service';
import { MainLayoutComponent } from './layout/main-layout.component';
import { LoadingComponent } from './shared/loading/loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent, LoadingComponent],
  template: `
    <app-loading></app-loading>
    <app-main-layout>
      <router-outlet></router-outlet>
    </app-main-layout>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'taskflow-shell';
  private routerSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    // Monitorar eventos de navegação do roteador para controlar o estado de carregamento
    this.routerSubscription = this.router.events
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          // Iniciar o indicador de carregamento quando a navegação começa
          this.loadingService.showLoading();
        } else if (
          event instanceof NavigationEnd || 
          event instanceof NavigationCancel || 
          event instanceof NavigationError
        ) {
          // Parar o indicador de carregamento quando a navegação termina (sucesso ou erro)
          this.loadingService.hideLoading();
        }
      });
  }

  ngOnDestroy() {
    // Limpeza da inscrição ao destruir o componente
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
