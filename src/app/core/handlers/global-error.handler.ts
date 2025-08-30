import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private router: Router,
    private zone: NgZone
  ) {}

  handleError(error: any): void {
    console.error('🚨 Global Error Handler:', error);

    // Check if it's a Module Federation error
    if (this.isModuleFederationError(error)) {
      console.error('🔧 Module Federation Error detected:', error);
      
      // Navigate to fallback component in the Angular zone
      this.zone.run(() => {
        this.router.navigate(['/']);
      });
      
      return;
    }

    // Check if it's a component creation error
    if (this.isComponentCreationError(error)) {
      console.error('🔧 Component Creation Error detected:', error);
      
      this.zone.run(() => {
        this.router.navigate(['/']);
      });
      
      return;
    }

    // Log the error for debugging
    console.error('Unhandled error:', error);
  }

  private isModuleFederationError(error: any): boolean {
    const message = error?.message || '';
    return message.includes('init is not a function') ||
           message.includes('Module Federation') ||
           message.includes('remote') ||
           message.includes('remoteEntry');
  }

  private isComponentCreationError(error: any): boolean {
    const message = error?.message || '';
    return message.includes('Cannot read properties of null') ||
           message.includes('reading \'type\'') ||
           message.includes('createComponent');
  }
}
