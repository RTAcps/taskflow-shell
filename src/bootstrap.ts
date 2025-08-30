import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Initialize the application
const initApp = () => {
  bootstrapApplication(AppComponent, appConfig)
    .catch(err => console.error('Error bootstrapping app', err));
};

// Start the application
initApp();
