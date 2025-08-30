import { loadRemoteModule } from '@angular-architects/module-federation';
import { Routes } from '@angular/router';
import { environment } from '../environments/environment';
import { HomeComponent } from './home/home.component';

/**
 * Load a remote component of the MFEs
 * Fail clearly if unable to load — no fallbacks or simulations
 */
const loadRemoteComponent = (
  remoteName: 'taskflow-component' | 'taskflow-reactive' | 'taskflow-functional', 
  exposedModule: string
) => {
  return () => {
    return loadRemoteModule({
      type: 'module',
      remoteEntry: environment.remoteUrls[remoteName],
      exposedModule: exposedModule
    })
    .then(m => {
      const component = findComponentInModule(m, exposedModule);
      if (component) {
        if (typeof component === 'function') {
          return component;
        }
        
        throw new Error(`❌ Export encontrado mas não é um componente válido: ${typeof component}`);
      }
      
      throw new Error(`❌ Nenhum componente encontrado no módulo ${exposedModule}`);
    })
    .catch(err => {
      if (err.message && err.message.includes('CORS')) {
        console.error(`🔧 DICA: Este erro de CORS indica que o MFE ${remoteName} está configurado para aceitar apenas o domínio de produção.`);
        console.error(`🔧 Para desenvolvimento local, o MFE precisa permitir 'http://localhost:4200' nas configurações de CORS.`);
      }
      
      return createErrorComponent(remoteName, exposedModule, err);
    });
  };
};

/**
 * Helper function to find a component from a module
 */
function findComponentInModule(module: any, exposedModule: string): any {
  if (module.default && typeof module.default === 'function') {
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
        return module[name];
      }
    }
  }
  
  const componentExport = Object.keys(module).find(key => 
    key.endsWith('Component') && typeof module[key] === 'function'
  );
  
  if (componentExport) {
    return module[componentExport];
  }
  
  const functionExport = Object.keys(module).find(key => 
    typeof module[key] === 'function'
  );
  
  if (functionExport) {
    return module[functionExport];
  }
  
  return null;
}

/**
 * Creates an error component when the MFE fails to load
 */
function createErrorComponent(remoteName: string, exposedModule: string, error: any) {
  const remoteUrls: any = environment.remoteUrls;
  const isCorsError = error.message && (
    error.message.includes('CORS') || 
    error.message.includes('blocked') ||
    error.message.includes('Access-Control-Allow-Origin')
  );
  
  return () => {
    return {
      template: `
        <div style="padding: 2rem; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; margin: 1rem;">
          <h2 style="color: #dc2626; margin-top: 0;">❌ Erro ao carregar MFE</h2>
          <p><strong>MFE:</strong> ${remoteName}</p>
          <p><strong>Módulo:</strong> ${exposedModule}</p>
          <p><strong>URL:</strong> ${remoteUrls[remoteName]}</p>
          
          ${isCorsError ? `
          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
            <h3 style="color: #92400e; margin-top: 0;">🔧 Problema de CORS Detectado</h3>
            <p style="color: #92400e; margin-bottom: 0;">
              O MFE está configurado para aceitar apenas requisições do domínio de produção.<br>
              Para desenvolvimento local, o MFE precisa permitir <code>http://localhost:4200</code> nas configurações de CORS.
            </p>
          </div>
          ` : ''}
          
          <details style="margin-top: 1rem;">
            <summary style="cursor: pointer; font-weight: bold;">Ver detalhes do erro</summary>
            <pre style="background: #fef2f2; padding: 1rem; border-radius: 4px; overflow: auto; white-space: pre-wrap;">${error.message || error}</pre>
          </details>
          
          <div style="margin-top: 1rem; padding: 1rem; background: #f3f4f6; border-radius: 4px;">
            <h4 style="margin-top: 0;">🔍 Possíveis soluções:</h4>
            <ul style="margin-bottom: 0;">
              <li>Verificar se o MFE está rodando e acessível</li>
              <li>Configurar CORS no MFE para aceitar localhost:4200</li>
              <li>Verificar se o módulo ${exposedModule} está sendo exposto corretamente</li>
              <li>Testar a URL diretamente no navegador: <a href="${remoteUrls[remoteName]}" target="_blank">${remoteUrls[remoteName]}</a></li>
            </ul>
          </div>
        </div>
      `,
      standalone: true
    };
  };
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
