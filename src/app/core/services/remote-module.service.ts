import { Injectable } from '@angular/core';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { LoadingService } from './loading.service';
import { from, Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RemoteModuleService {
  constructor(private loadingService: LoadingService) {}

  loadComponent<T>(remoteEntry: string, exposedModule: string, componentAccessor: (module: any) => T): Observable<T> {
    this.loadingService.showLoading();
    
    return from(
      loadRemoteModule({
        type: 'module',
        remoteEntry: remoteEntry,
        exposedModule: exposedModule
      })
    ).pipe(
      map(m => componentAccessor(m)),
      finalize(() => this.loadingService.hideLoading())
    );
  }
}
