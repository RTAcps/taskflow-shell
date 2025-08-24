/* Script para injetar estilos para componentes MFE */
(function() {
  // Esperar até que o DOM esteja pronto
  document.addEventListener('DOMContentLoaded', function() {
    // Verificar a cada 100ms se os componentes MFE foram carregados
    const checkInterval = setInterval(function() {
      const projectListComponent = document.querySelector('app-project-list');
      const kanbanBoardComponent = document.querySelector('app-kanban-board');
      const projectFormComponent = document.querySelector('app-project-form');
      
      if (projectListComponent || kanbanBoardComponent || projectFormComponent) {
        console.log('MFE components detected, applying styles');
        clearInterval(checkInterval);
        applyMfeStyles();
      }
    }, 100);
    
    // Parar de verificar após 10 segundos
    setTimeout(function() {
      clearInterval(checkInterval);
    }, 10000);
  });
  
  function applyMfeStyles() {
    // Definir variáveis CSS para os componentes MFE
    document.documentElement.style.setProperty('--primary-50', '#f5f9ff');
    document.documentElement.style.setProperty('--primary-100', '#d0e1fd');
    document.documentElement.style.setProperty('--primary-200', '#abc9fb');
    document.documentElement.style.setProperty('--primary-300', '#86b0f9');
    document.documentElement.style.setProperty('--primary-400', '#6198f7');
    document.documentElement.style.setProperty('--primary-500', '#3B82F6');
    document.documentElement.style.setProperty('--primary-600', '#2272f5');
    document.documentElement.style.setProperty('--primary-700', '#0c61e4');
    document.documentElement.style.setProperty('--primary-800', '#0a52c2');
    document.documentElement.style.setProperty('--primary-900', '#08429f');
    document.documentElement.style.setProperty('--primary-950', '#072e6f');
    document.documentElement.style.setProperty('--surface-0', '#ffffff');
    document.documentElement.style.setProperty('--surface-50', '#F8F9FA');
    document.documentElement.style.setProperty('--surface-100', '#f2f4f6');
    document.documentElement.style.setProperty('--surface-200', '#e9ecef');
    document.documentElement.style.setProperty('--surface-300', '#dee2e6');
    document.documentElement.style.setProperty('--surface-400', '#ced4da');
    document.documentElement.style.setProperty('--surface-500', '#adb5bd');
    document.documentElement.style.setProperty('--surface-600', '#6c757d');
    document.documentElement.style.setProperty('--surface-700', '#495057');
    document.documentElement.style.setProperty('--surface-800', '#343a40');
    document.documentElement.style.setProperty('--surface-900', '#212529');
    document.documentElement.style.setProperty('--surface-950', '#0f1315');
    
    // Variáveis para prioridades
    document.documentElement.style.setProperty('--priority-highest', '#d32f2f');
    document.documentElement.style.setProperty('--priority-high', '#f44336');
    document.documentElement.style.setProperty('--priority-medium', '#ff9800');
    document.documentElement.style.setProperty('--priority-low', '#4caf50');
    
    console.log('MFE CSS variables set successfully');
    
    // Para o Kanban Board, vamos garantir que os estilos sejam aplicados
    const kanbanBoard = document.querySelector('app-kanban-board');
    if (kanbanBoard) {
      console.log('Applying specific styles to KanbanBoard component');
      
      // Aplicar estilos diretamente no componente kanban
      setTimeout(() => {
        const priorityElements = kanbanBoard.querySelectorAll('.priority');
        if (priorityElements.length > 0) {
          console.log('Found priority elements:', priorityElements.length);
          priorityElements.forEach(el => {
            const className = el.className;
            if (className.includes('priority-')) {
              console.log('Applied priority styles to:', className);
            }
          });
        } else {
          console.log('No priority elements found yet, will try again');
          // Tentar novamente após um breve delay
          setTimeout(() => {
            const retryElements = kanbanBoard.querySelectorAll('.priority');
            console.log('Retry found priority elements:', retryElements.length);
          }, 1000);
        }
      }, 500);
    }
  }
})();
