import { ApplicationConfig, ErrorHandler, Injectable, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, NoPreloading } from '@angular/router';

import { routes } from './app.routes';

// Custom error handler for Module Federation errors
@Injectable()
class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Handle specific federation errors
    if (error && error.message && error.message.includes('Cannot read properties of undefined')) {
      console.error('Module Federation Error: This may be due to a remote module failing to load', error);
    } else if (error && error.toString().includes('is not a function')) {
      console.error('Module Federation Error: Remote module may have an incompatible interface', error);
    } else {
      console.error('Application Error:', error);
    }
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(
      routes,
      // Use NoPreloading to load routes on demand only
      withPreloading(NoPreloading)
    )
  ]
};
