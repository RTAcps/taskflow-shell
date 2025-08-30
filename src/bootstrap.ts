import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Verificar se o ambiente de Module Federation está funcionando
 */
function checkModuleFederationEnvironment() {
  console.log('🔧 Checking Module Federation environment...');
  
  if (typeof (window as any).__webpack_require__ === 'undefined') {
    console.warn('⚠️ __webpack_require__ not available - Module Federation may have issues');
  } else {
    console.log('✅ __webpack_require__ is available');
  }
  
  if (typeof (window as any).webpackChunkName === 'undefined') {
    console.log('ℹ️ webpackChunkName not defined (normal for shell app)');
  }
  
  console.log('🔧 Module Federation environment check completed');
}

window.addEventListener('error', (event) => {
  console.error('🚨 Global Window Error:', event.error);
  
  if (event.error?.message?.includes('is not a function') || 
      event.error?.message?.includes('Loading script failed') ||
      event.error?.message?.includes('get is not a function') ||
      event.error?.message?.includes('init is not a function')) {
    console.error('🔧 Module Federation Error detected in window handler');
    event.preventDefault(); 
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
  
  if (event.reason?.message?.includes('Loading script failed') ||
      event.reason?.message?.includes('is not a function') ||
      event.reason?.message?.includes('get is not a function') ||
      event.reason?.message?.includes('init is not a function')) {
    console.error('🔧 Module Federation Error detected in promise handler');
    event.preventDefault(); 
  }
});

checkModuleFederationEnvironment();

const initApp = () => {
  bootstrapApplication(AppComponent, appConfig)
    .catch(err => {
      console.error('❌ Error bootstrapping app:', err);
      
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

initApp();
