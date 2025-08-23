import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface LayoutConfig {
    preset?: string;
    primary?: string;
    surface?: string | undefined | null;
    darkTheme?: boolean;
    menuMode?: string;
}

interface LayoutState {
    staticMenuDesktopInactive?: boolean;
    overlayMenuActive?: boolean;
    configSidebarVisible?: boolean;
    staticMenuMobileActive?: boolean;
    menuHoverActive?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    private _config: LayoutConfig = {
        preset: 'TaskFlow',
        primary: 'indigo',
        surface: null,
        darkTheme: false,
        menuMode: 'static'
    };

    private readonly _state: LayoutState = {
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false
    };

    layoutConfig = signal<LayoutConfig>(this._config);
    layoutState = signal<LayoutState>(this._state);
    private readonly configUpdate = new Subject<LayoutConfig>();

    get config(): LayoutConfig {
        return this._config;
    }

    toggleMenu(event?: Event) {
        if (event) {
            event.preventDefault();
        }

        const newState = { ...this.layoutState() };

        if (this.isOverlay()) {
            newState.overlayMenuActive = !newState.overlayMenuActive;
            if (newState.overlayMenuActive) {
                this.overlayOpen.next(null);
            }
        }

        if (this.isDesktop()) {
            newState.staticMenuDesktopInactive = !newState.staticMenuDesktopInactive;
        } else {
            newState.staticMenuMobileActive = !newState.staticMenuMobileActive;
            if (newState.staticMenuMobileActive) {
                this.overlayOpen.next(null);
            }
        }

        // Atualiza o state usando o signal para garantir que a UI seja atualizada
        this.layoutState.set(newState);
    }

    isOverlay(): boolean {
        return this._config.menuMode === 'overlay';
    }

    isDesktop(): boolean {
        return window.innerWidth > 1023;
    }

    overlayOpen = new Subject();

    onConfigUpdate() {
        return this.configUpdate.asObservable();
    }

    updateConfig(config: LayoutConfig) {
        this._config = { ...this._config, ...config };
        this.layoutConfig.set(this._config);
        this.configUpdate.next(this._config);
    }
    
    onWindowResize() {
        // Atualiza o estado do layout com base no tamanho atual da janela
        const newState = { ...this.layoutState() };
        
        // Se o menu mobile estiver ativo e a tela for redimensionada para desktop
        if (newState.staticMenuMobileActive && this.isDesktop()) {
            newState.staticMenuMobileActive = false;
        }
        
        // Se estiver em modo overlay e o menu estiver ativo, mas a tela for redimensionada
        if (this.isOverlay() && newState.overlayMenuActive && !this.isDesktop()) {
            newState.overlayMenuActive = false;
        }
        
        // Atualiza o state usando o signal para garantir que a UI seja atualizada
        this.layoutState.set(newState);
    }
}
