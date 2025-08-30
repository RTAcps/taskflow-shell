import { MfeConfig } from './models/mfe-config.interface';
import { environment } from '../../environments/environment';

export const MFE_CONFIG: MfeConfig = {
  mfeComponents: {
    projectManagement: {
      remoteEntry: environment.remoteUrls['taskflow-component'],
      exposedModule: './component',
      componentName: 'ProjectManagementComponent'
    },
    realTimeCollaboration: {
      remoteEntry: environment.remoteUrls['taskflow-reactive'],
      exposedModule: './component',
      componentName: 'RealTimeCollaborationComponent'
    },
    analyticsReport: {
      remoteEntry: environment.remoteUrls['taskflow-functional'],
      exposedModule: './component',
      componentName: 'AnalyticsReportComponent'
    }
  }
};
