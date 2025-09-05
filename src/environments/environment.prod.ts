import { Environment } from './environment.interface';

export const environment: Environment = {
    production: true,
    remoteUrls: {
        'taskflow-component': 'https://taskflow-component.netlify.app/remoteEntry.js',
        'taskflow-reactive': 'https://taskflow-reactive.netlify.app/remoteEntry.js',
        'taskflow-functional': 'https://taskflow-functional.netlify.app/remoteEntry.js',
    }
};
