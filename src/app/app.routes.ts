import { Routes } from '@angular/router';
import { environment } from '../environments/environment';
import { HomeComponent } from './home/home.component';
import { ModuleUnavailableComponent } from './shared/module-unavailable/module-unavailable.component';
import { ModuleFederationHelper } from './core/utils/module-federation-helper';
import { ManualModuleLoader } from './core/utils/manual-module-loader';

/**
 * Load a remote component of the MFEs
 * Returns ModuleUnavailableComponent if unable to load
 */
const loadRemoteComponent = (
  remoteName: 'taskflow-component' | 'taskflow-reactive' | 'taskflow-functional', 
  exposedModule: string
) => {
  return () => {
    console.log(`🔄 Attempting to load ${remoteName} -> ${exposedModule}`);
    console.log(`📍 Remote URL: ${environment.remoteUrls[remoteName]}`);
    
    return ManualModuleLoader.loadRemoteModule(remoteName, exposedModule)
      .then((m: any) => {
        console.log(`✅ Module loaded for ${remoteName} using manual loader:`, Object.keys(m));
        
        const component = findComponentInModule(m, exposedModule);
        if (component) {
          if (typeof component === 'function') {
            console.log(`✅ Component found and validated for ${remoteName} -> ${exposedModule}`);
            return component;
          }
          
          console.error(`❌ Export encontrado mas não é um componente válido: ${typeof component}`);
          return ModuleUnavailableComponent;
        }
        
        console.error(`❌ Nenhum componente encontrado no módulo ${exposedModule}`);
        return ModuleUnavailableComponent;
      })
      .catch((err) => {
        console.log(`⚠️ Carregador manual falhou, tentando abordagem padrão...`, err);
        
        return ModuleFederationHelper.loadRemoteModuleWithRetry({
          remoteEntry: environment.remoteUrls[remoteName],
          exposedModule: exposedModule,
          remoteName: remoteName,
          maxRetries: 3,
          retryDelay: 1000
        })
        .then((m: any) => {
          console.log(`✅ Module loaded for ${remoteName} with fallback loader:`, Object.keys(m));
          
          const component = findComponentInModule(m, exposedModule);
          if (component) {
            if (typeof component === 'function') {
              console.log(`✅ Component found and validated for ${remoteName} -> ${exposedModule}`);
              return component;
            }
            
            console.error(`❌ Export encontrado mas não é um componente válido: ${typeof component}`);
            return ModuleUnavailableComponent;
          }
          
          console.error(`❌ Nenhum componente encontrado no módulo ${exposedModule}`);
          return ModuleUnavailableComponent;
        })
        .catch((err: any) => {
          console.error(`❌ Erro ao carregar ${remoteName} -> ${exposedModule}:`, err);
          
          if (err?.message?.includes('CORS')) {
            console.error(`🔧 DICA: Este erro de CORS indica que o MFE ${remoteName} está configurado para aceitar apenas o domínio de produção.`);
            console.error(`🔧 Para desenvolvimento local, o MFE precisa permitir 'http://localhost:4200' nas configurações de CORS.`);
          }
          
          return ModuleUnavailableComponent;
        });
      });
  };
};

/**
 * Helper function to find a component from a module
 */
function findComponentInModule(module: any, exposedModule: string): any {
  console.log(`🔍 Searching for component in module:`, Object.keys(module));
  
  if (module.default && typeof module.default === 'function') {
    console.log(`✅ Found default export`);
    return module.default;
  }
  
  const specificNames = {
    './ProjectListComponent': ['ProjectListComponent'],
    './KanbanBoardComponent': ['KanbanBoardComponent'],
    './ProjectFormComponent': ['ProjectFormComponent'],
    './RealTimeCollaborationComponent': ['RealtimeCollaborationComponent', 'RealTimeCollaborationComponent'],
    './AnalyticsReportComponent': ['AnalyticsReportComponent', 'DashboardComponent'],
    './Module': ['AppComponent', 'default']
  };
  
  if (specificNames[exposedModule as keyof typeof specificNames]) {
    for (const name of specificNames[exposedModule as keyof typeof specificNames]) {
      if (module[name] && typeof module[name] === 'function') {
        console.log(`✅ Found specific component: ${name}`);
        return module[name];
      }
    }
  }
  
  const componentExport = Object.keys(module).find(key => 
    key.endsWith('Component') && typeof module[key] === 'function'
  );
  
  if (componentExport) {
    console.log(`✅ Found component export: ${componentExport}`);
    return module[componentExport];
  }
  
  const functionExport = Object.keys(module).find(key => 
    typeof module[key] === 'function'
  );
  
  if (functionExport) {
    console.log(`✅ Found function export: ${functionExport}`);
    return module[functionExport];
  }
  
  console.log(`❌ No valid component found in module`);
  return null;
}

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        pathMatch: 'full'
    },
    {
        path: 'project-management',
        children: [
            {
                path: '',
                redirectTo: 'projects',
                pathMatch: 'full'
            },
            {
                path: 'projects',
                loadComponent: loadRemoteComponent('taskflow-component', './ProjectListComponent')
            },
            {
                path: 'projects/new',
                loadComponent: loadRemoteComponent('taskflow-component', './ProjectFormComponent')
            },
            {
                path: 'projects/edit/:id',
                loadComponent: loadRemoteComponent('taskflow-component', './ProjectFormComponent')
            },
            {
                path: 'projects/:id/board',
                loadComponent: loadRemoteComponent('taskflow-component', './KanbanBoardComponent')
            }
        ]
    },
    {
        path: 'real-time-collaboration',
        loadComponent: loadRemoteComponent('taskflow-reactive', './RealTimeCollaborationComponent')
    },
    {
        path: 'analytics-report',
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: loadRemoteComponent('taskflow-functional', './Module')
            },
            {
                path: 'reports/new',
                loadComponent: loadRemoteComponent('taskflow-functional', './Module')
            },
            {
                path: 'reports/:id',
                loadComponent: loadRemoteComponent('taskflow-functional', './Module')
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
