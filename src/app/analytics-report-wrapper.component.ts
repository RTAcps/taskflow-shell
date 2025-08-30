import { Component, OnInit } from '@angular/core';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../environments/environment';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-analytics-report-wrapper',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="analytics-wrapper">
      <ng-container *ngIf="analyticsComponent && report">
        <ng-container *ngComponentOutlet="analyticsComponent; inputs: { report: report, isStandalone: false }"></ng-container>
      </ng-container>
      <div *ngIf="!analyticsComponent" class="loading">Carregando relatório...</div>
    </div>
  `,
  styles: [`
    .analytics-wrapper {
      padding: 1rem;
    }
    .loading {
      text-align: center;
      padding: 2rem;
      color: var(--text-color-secondary);
    }
  `]
})
export class AnalyticsReportWrapperComponent implements OnInit {
  analyticsComponent: any;
  report: any;
  private retryCount = 0;
  private readonly maxRetries = 2;

  constructor(private readonly notificationService: NotificationService) { }
  
  ngOnInit(): void {
    this.loadAnalyticsComponent();
    this.loadReportData();
  }

  async loadAnalyticsComponent() {
    try {
      const module = await loadRemoteModule({
        type: 'module',
        remoteEntry: environment.remoteUrls['taskflow-functional'],
        exposedModule: './AnalyticsReportComponent'
      });
      
      this.analyticsComponent = module.AnalyticsReportComponent;
    } catch (error) {
      console.error('Erro ao carregar componente de análise:', error);
      
      // Se atingiu o número máximo de tentativas, mostra o erro e redireciona
      if (this.retryCount >= this.maxRetries) {
        this.notificationService.showErrorWithRedirect(
          'Não foi possível carregar o módulo de análise. Você será redirecionado para a página inicial.',
          '/home',
          8000,
          'Erro ao carregar relatório de análise'
        );
      } else {
        // Tenta novamente
        this.retryCount++;
        setTimeout(() => this.loadAnalyticsComponent(), 1500);
      }
    }
  }

  loadReportData() {
    // Dados de exemplo para o relatório
    this.report = {
      id: 'dashboard-report',
      config: {
        id: 'dashboard-overview',
        name: 'Visão Geral do Dashboard',
        projectIds: ['1', '2', '3', '4'],
        metrics: ['totalTasks', 'completedTasks', 'completionRate', 'overdueTasksCount']
      },
      generatedAt: new Date(),
      metrics: {
        totalTasks: 145,
        completedTasks: 87,
        completionRate: 60,
        overdueTasksCount: 12,
        tasksByStatus: {
          0: 45,  // PENDING
          1: 38,  // IN_PROGRESS
          2: 87,  // DONE
          3: 15,  // REVIEW
          4: 7    // BLOCKED
        },
        tasksByPriority: {},
        memberPerformance: []
      },
      trends: [
        {
          period: 'Semana 1',
          completedTasks: 12,
          addedTasks: 24,
          activeTasksCount: 32,
          cumulativeCompletion: 12
        },
        {
          period: 'Semana 2',
          completedTasks: 18,
          addedTasks: 15,
          activeTasksCount: 29,
          cumulativeCompletion: 30
        },
        {
          period: 'Semana 3',
          completedTasks: 25,
          addedTasks: 10,
          activeTasksCount: 14,
          cumulativeCompletion: 55
        },
        {
          period: 'Semana 4',
          completedTasks: 32,
          addedTasks: 8,
          activeTasksCount: 16,
          cumulativeCompletion: 87
        }
      ],
      recommendations: [
        'Reduzir o número de tarefas bloqueadas',
        'Melhorar a taxa de conclusão das tarefas',
        'Revisar as tarefas atrasadas'
      ]
    };
  }
}
