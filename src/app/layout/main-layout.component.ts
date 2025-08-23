import { CommonModule } from '@angular/common';
import { Component, Renderer2, effect, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { LayoutService } from './service/layout.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  overlayMenuOpenSubscription: Subscription;
  menuOutsideClickListener: any;
  windowResizeListener: Function | null = null;

  get containerClass(): { [key: string]: boolean } {
    return {
      'layout-theme-light': !this.layoutService.config.darkTheme,
      'layout-theme-dark': !!this.layoutService.config.darkTheme,
      'layout-overlay': !!this.layoutService.isOverlay(),
      'layout-static': !this.layoutService.isOverlay(),
      'layout-static-inactive': !!this.layoutService.layoutState().staticMenuDesktopInactive,
      'layout-overlay-active': !!this.layoutService.layoutState().overlayMenuActive,
      'layout-mobile-active': !!this.layoutService.layoutState().staticMenuMobileActive,
      'p-input-filled': true,
      'p-ripple-disabled': false
    };
  }

  constructor(
    public layoutService: LayoutService,
    public renderer: Renderer2,
    private readonly router: Router
  ) {
    this.overlayMenuOpenSubscription = this.layoutService.overlayOpen.subscribe(() => {
      if (!this.menuOutsideClickListener) {
        this.menuOutsideClickListener = this.renderer.listen('document', 'click', (event) => {
          const isOutsideClicked = !(
            this.isElementInSidebar(event.target) ||
            this.isElementInTopbar(event.target)
          );
          if (isOutsideClicked) {
            this.hideMenu();
          }
        });
      }
    });
    
    // Apply theme class on initialization
    this.applyThemeClass();
    
    // Apply theme class on config changes
    effect(() => {
      const config = this.layoutService.layoutConfig();
      if (config) {
        this.applyThemeClass();
      }
    });
  }
  
  toggleTheme() {
    const updatedConfig = {
      ...this.layoutService.config,
      darkTheme: !this.layoutService.config.darkTheme
    };
    this.layoutService.updateConfig(updatedConfig);
  }
  
  private applyThemeClass() {
    if (this.layoutService.config.darkTheme) {
      document.body.classList.add('layout-theme-dark');
    } else {
      document.body.classList.remove('layout-theme-dark');
    }
  }

  toggleMenu(event: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.layoutService.toggleMenu(event);
  }

  isSidebarActive(): boolean {
    const layoutState = this.layoutService.layoutState();
    
    if (this.layoutService.isOverlay()) {
      // No modo overlay, verificamos se o menu overlay está ativo
      return !!layoutState.overlayMenuActive;
    } else if (this.layoutService.isDesktop()) {
      // Em desktop no modo static, verificamos se o menu está inativo
      return !!layoutState.staticMenuDesktopInactive;
    } else {
      // Em mobile no modo static, verificamos se o menu mobile está ativo
      return !!layoutState.staticMenuMobileActive;
    }
  }
  
  getMenuToggleIcon(): string {
    if (this.layoutService.isDesktop() && !this.layoutService.isOverlay()) {
      // No desktop em modo static:
      // - Quando staticMenuDesktopInactive é true, o menu está recolhido, então mostramos > para expandir
      // - Quando staticMenuDesktopInactive é false, o menu está expandido, então mostramos < para recolher
      const isMenuRecolhido = !!this.layoutService.layoutState().staticMenuDesktopInactive;
      return isMenuRecolhido ? 'pi-chevron-right' : 'pi-chevron-left';
    } else {
      // Em telas pequenas ou modo overlay, usamos os ícones de barras/fechar
      return this.isSidebarActive() ? 'pi-times' : 'pi-bars';
    }
  }
  
  getMenuToggleTitle(): string {
    if (this.layoutService.isDesktop() && !this.layoutService.isOverlay()) {
      // No desktop em modo static
      const isMenuRecolhido = !!this.layoutService.layoutState().staticMenuDesktopInactive;
      return isMenuRecolhido ? 'Expand Menu' : 'Collapse Menu';
    } else {
      // Em telas pequenas ou modo overlay
      return this.isSidebarActive() ? 'Close Menu' : 'Open Menu';
    }
  }
  
  hideMenu() {
    this.layoutService.layoutState.set({
      ...this.layoutService.layoutState(),
      overlayMenuActive: false,
      staticMenuMobileActive: false,
      menuHoverActive: false
    });
  }

  private isElementInSidebar(element: any): boolean {
    return element.closest('.layout-sidebar') !== null;
  }

  private isElementInTopbar(element: any): boolean {
    return element.closest('.layout-topbar') !== null;
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
  
  // Detector de redimensionamento de janela
  @HostListener('window:resize')
  onResize() {
    this.layoutService.onWindowResize();
  }
  
  ngOnInit() {
    // Inicializa o estado do layout com base no tamanho atual da janela
    this.layoutService.onWindowResize();
  }
  
  ngOnDestroy() {
    // Limpeza do listener do menu
    if (this.overlayMenuOpenSubscription) {
      this.overlayMenuOpenSubscription.unsubscribe();
    }
    
    // Limpeza do listener de clique fora do menu
    if (this.menuOutsideClickListener) {
      this.menuOutsideClickListener();
    }
  }
}
