import { ApplicationConfig, ErrorHandler, Injectable, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, NoPreloading } from '@angular/router';

import { routes } from './app.routes';

// Custom error handler for Module Federation errors
@Injectable()
class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Capture the original error message
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    // Handle specific federation errors for standalone components
    if (errorMessage.includes('NG0203') || errorMessage.includes('injection failed')) {
      console.error('Angular Injection Context Error:', {
        message: errorMessage,
        details: 'This may be due to using inject() outside of an injection context',
        solution: 'Ensure inject() is used within constructors, factory functions, or with runInInjectionContext',
        originalError: error
      });
    } else if (errorMessage.includes('Cannot read properties of undefined') || 
        errorMessage.includes('is not a function') ||
        errorMessage.includes('get is not a function')) {
      console.error('Module Federation Error: Remote standalone component loading issue', {
        message: errorMessage,
        cause: error?.stack || 'Unknown cause',
        originalError: error
      });
    } else if (errorMessage.includes('Failed to load remote module') ||
               errorMessage.includes('Error loading remote standalone component')) {
      console.error('Module Federation Error: Failed to load remote module', {
        message: errorMessage,
        details: 'This may be due to network issues or the remote module being unavailable',
        originalError: error
      });
    } else if (errorMessage.includes('No component found in remote module')) {
      console.error('Module Federation Error: Remote module loaded but component not found', {
        message: errorMessage,
        details: 'The remote module may have a different export structure than expected',
        originalError: error
      });
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
