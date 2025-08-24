import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { loadRemoteModule } from '@angular-architects/module-federation';

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
                loadComponent: () => 
                    loadRemoteModule({
                        type: 'module',
                        remoteEntry: 'http://localhost:4201/remoteEntry.js',
                        exposedModule: './ProjectListComponent'
                    }).then(m => m.ProjectListComponent)
            },
            {
                path: 'projects/new',
                loadComponent: () => 
                    loadRemoteModule({
                        type: 'module',
                        remoteEntry: 'http://localhost:4201/remoteEntry.js',
                        exposedModule: './ProjectFormComponent'
                    }).then(m => m.ProjectFormComponent)
            },
            {
                path: 'projects/edit/:id',
                loadComponent: () => 
                    loadRemoteModule({
                        type: 'module',
                        remoteEntry: 'http://localhost:4201/remoteEntry.js',
                        exposedModule: './ProjectFormComponent'
                    }).then(m => m.ProjectFormComponent)
            },
            {
                path: 'projects/:id/board',
                loadComponent: () => 
                    loadRemoteModule({
                        type: 'module',
                        remoteEntry: 'http://localhost:4201/remoteEntry.js',
                        exposedModule: './KanbanBoardComponent'
                    }).then(m => m.KanbanBoardComponent)
            }
        ]
    },
    {
        path: 'real-time-collaboration',
        loadComponent: () => 
            loadRemoteModule({
                type: 'module',
                remoteEntry: 'http://localhost:4202/remoteEntry.js',
                exposedModule: './RealTimeCollaborationComponent'
            }).then(m => {
                return m.RealtimeCollaborationComponent;
            })
    },
    {
        path: 'analytics-report',
        loadComponent: () => import('./analytics-report-wrapper.component').then(m => m.AnalyticsReportWrapperComponent)
    },
];
