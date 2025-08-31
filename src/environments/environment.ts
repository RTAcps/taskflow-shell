import { Environment } from './environment.interface';

export const environment: Environment = {
    production: false,
    remoteUrls: {
        // URLs de desenvolvimento local - descomente para usar MFEs locais
        // 'taskflow-component': 'http://localhost:4201/remoteEntry.js',
        // 'taskflow-reactive': 'http://localhost:4202/remoteEntry.js',
        // 'taskflow-functional': 'http://localhost:4203/remoteEntry.js',
        
        // URLs de produção 
        'taskflow-component': 'https://taskflow-component.netlify.app/remoteEntry.js',
        'taskflow-reactive': 'https://taskflow-reactive.netlify.app/remoteEntry.js',
        'taskflow-functional': 'https://taskflow-functional.netlify.app/remoteEntry.js',
    },
    // Configurações para lidar com CORS
    cors: {
        // Defina como true para tentar usar um proxy CORS automático quando disponível
        enableProxy: true,
        // URLs de proxy CORS alternativas se cors-anywhere não estiver disponível
        proxyUrls: [
            'https://cors-anywhere.herokuapp.com/',
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url='
        ]
    }
};
