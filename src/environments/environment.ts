export const environment = {
    production: false,
    remoteUrls: {
        /*
        // URLs de desenvolvimento local - configure as portas onde seus MFEs estão rodando
        'taskflow-component': 'http://localhost:4201/remoteEntry.js',
        'taskflow-reactive': 'http://localhost:4202/remoteEntry.js',
        'taskflow-functional': 'http://localhost:4203/remoteEntry.js',
        */
        // URLs de produção 
        'taskflow-component': 'https://taskflow-component.netlify.app/remoteEntry.js',
        'taskflow-reactive': 'https://taskflow-reactive.netlify.app/remoteEntry.js',
        'taskflow-functional': 'https://taskflow-functional.netlify.app/remoteEntry.js',
    }
};
