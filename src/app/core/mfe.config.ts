import { MfeConfig } from './models/mfe-config.interface';

export const MFE_CONFIG: MfeConfig = {
  mfeComponents: {
    projectManagement: {
      remoteEntry: 'http://localhost:4201/remoteEntry.js',
      exposedModule: './component',
      componentName: 'ProjectManagementComponent'
    },
    realTimeCollaboration: {
      remoteEntry: 'http://localhost:4202/remoteEntry.js',
      exposedModule: './component',
      componentName: 'RealTimeCollaborationComponent'
    },
    analyticsReport: {
      remoteEntry: 'http://localhost:4203/remoteEntry.js',
      exposedModule: './component',
      componentName: 'AnalyticsReportComponent'
    }
  }
};
