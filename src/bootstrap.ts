import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Global error handlers for unhandled errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global Window Error:', event.error);
  event.preventDefault(); 
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
  event.preventDefault(); 
});

// Initialize the application
const initApp = () => {
  bootstrapApplication(AppComponent, appConfig)
    .catch(err => {
      console.error('❌ Error bootstrapping app:', err);
      
      // Try to show a user-friendly error message
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `
        <div style="
          position: fixed; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%);
          background: #fee2e2; 
          border: 2px solid #dc2626; 
          border-radius: 8px; 
          padding: 2rem; 
          max-width: 500px;
          z-index: 9999;
        ">
          <h2 style="color: #dc2626; margin-top: 0;">Erro ao Carregar Aplicação</h2>
          <p>Houve um problema ao inicializar a aplicação. Por favor, recarregue a página.</p>
          <button onclick="window.location.reload()" style="
            background: #dc2626; 
            color: white; 
            border: none; 
            padding: 0.5rem 1rem; 
            border-radius: 4px; 
            cursor: pointer;
          ">Recarregar Página</button>
        </div>
      `;
      document.body.appendChild(errorDiv);
    });
};

// Start the application
initApp();
