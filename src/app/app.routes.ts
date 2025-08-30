import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { environment } from '../environments/environment';
import { ModuleUnavailableComponent } from './shared/module-unavailable/module-unavailable.component';
import { loadRemoteModule } from '@angular-architects/module-federation';

// Whether to use the actual modules (when working) or the unavailable component
const USE_ACTUAL_MODULES = false;

/**
 * Helper function that handles the loading of remote standalone components
 * with proper error handling and fallback to the ModuleUnavailableComponent
 */
const loadStandaloneComponent = (remoteName: 'taskflow-component' | 'taskflow-reactive' | 'taskflow-functional', exposedModule: string) => {
  return () => {
    if (!USE_ACTUAL_MODULES) {
      return Promise.resolve(ModuleUnavailableComponent);
    }
    
    return loadRemoteModule({
      type: 'module',
      remoteEntry: environment.remoteUrls[remoteName],
      exposedModule: exposedModule
    })
    .then(m => {
      // Find the component in the module's exports
      // With standalone components, this should be the default export or a named export
      
      // Try to get the most likely component from the module
      // First, try by expected name pattern
      const componentByName = getComponentFromModule(m, exposedModule);
      if (componentByName) {
        return componentByName;
      }
      
      // No component found
      console.error(`No component found in remote module: ${exposedModule}`);
      return ModuleUnavailableComponent;
    })
    .catch(err => {
      console.error(`Error loading remote standalone component: ${exposedModule}`, err);
      return ModuleUnavailableComponent;
    });
  };
};

/**
 * Helper function to extract a component from a module
 */
function getComponentFromModule(module: any, exposedModule: string): any {
  // Try the named export with the full path name
  const componentName = exposedModule.split('/').pop() || '';
  if (module[componentName]) {
    return module[componentName];
  }
  
  // Try other common patterns
  if (module.default) {
    return module.default;
  }
  
  // Find any export ending with Component
  const componentKey = Object.keys(module).find(key => 
    typeof module[key] === 'function' && 
    key.endsWith('Component')
  );
  
  if (componentKey) {
    return module[componentKey];
  }
  
  return null;
}

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        pathMatch: 'full'
    },
    // Use ModuleUnavailableComponent for all routes that were previously using Module Federation
    // This is a temporary solution until the Module Federation issues are resolved
    {
        path: 'project-management',
        component: ModuleUnavailableComponent
    },
    {
        path: 'real-time-collaboration',
        component: ModuleUnavailableComponent
    },
    {
        path: 'analytics-report',
        component: ModuleUnavailableComponent
    },
    {
        path: '**',
        component: ModuleUnavailableComponent
    }
];

/**
 * These routes use Module Federation to dynamically load remote standalone components.
 * They are commented out due to issues with the current implementation.
 * 
 * To use these routes:
 * 1. Fix the Module Federation setup
 * 2. Set USE_ACTUAL_MODULES to true 
 * 3. Replace the simple routes above with these routes
 */
/*
export const federatedRoutes: Routes = [
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
                loadComponent: loadStandaloneComponent('taskflow-component', './ProjectListComponent')
            },
            {
                path: 'projects/new',
                loadComponent: loadStandaloneComponent('taskflow-component', './ProjectFormComponent')
            },
            {
                path: 'projects/edit/:id',
                loadComponent: loadStandaloneComponent('taskflow-component', './ProjectFormComponent')
            },
            {
                path: 'projects/:id/board',
                loadComponent: loadStandaloneComponent('taskflow-component', './KanbanBoardComponent')
            }
        ]
    },
    {
        path: 'real-time-collaboration',
        loadComponent: loadStandaloneComponent('taskflow-reactive', './RealTimeCollaborationComponent')
    },
    {
        path: 'analytics-report',
        loadComponent: loadStandaloneComponent('taskflow-functional', './AnalyticsReportComponent')
    },
    {
        path: '**',
        component: ModuleUnavailableComponent
    }
];
*/
