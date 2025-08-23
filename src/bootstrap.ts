import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Initialize the application only when all remote modules are loaded
// or if any fails to load, we still want to show the shell
const initApp = () => {
  bootstrapApplication(AppComponent, appConfig)
    .catch(err => console.error('Error bootstrapping app', err));
};

// Manually initialize app after ensuring remote modules are loaded
initApp();
