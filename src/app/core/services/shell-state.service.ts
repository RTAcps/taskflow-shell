import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShellStateService {
  private stateSubject = new BehaviorSubject<any>({});
  
  // Observable que os MFEs podem assinar para receber atualizações
  public state$: Observable<any> = this.stateSubject.asObservable();

  // Método para atualizar o estado
  updateState(newState: Partial<any>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...newState
    });
  }

  // Método para obter o estado atual
  getCurrentState(): any {
    return this.stateSubject.value;
  }

  // Método para comunicação entre MFEs
  broadcast(channel: string, data: any): void {
    this.updateState({ [channel]: data });
  }
}
