import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading, NoPreloading } from '@angular/router';
import { provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(NoPreloading)),
    provideHttpClient(withFetch())
  ]
};
