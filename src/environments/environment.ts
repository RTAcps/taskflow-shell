import { Environment } from './environment.interface';

export const environment: Environment = {
    production: false,
    remoteUrls: {
        // URLs de desenvolvimento local - usadas para desenvolvimento
        'taskflow-component': 'http://localhost:4201/remoteEntry.js',
        'taskflow-reactive': 'http://localhost:4202/remoteEntry.js',
        'taskflow-functional': 'http://localhost:4203/remoteEntry.js',
    }
};
