import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import Swal from 'sweetalert2';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timeout?: number;
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  constructor(private router: Router) {}

  /**
   * Exibe uma notificação usando SweetAlert2
   */
  show(
    message: string, 
    type: 'success' | 'info' | 'warning' | 'error' = 'info', 
    timeout = 5000,
    title?: string
  ): string {
    const id = this.generateId();
    const notification: Notification = {
      id,
      message,
      type,
      timeout,
      title
    };
    
    // Adiciona na lista de notificações para compatibilidade com o componente atual
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);
    
    // Configura o SweetAlert2
    const iconMap = {
      'success': 'success',
      'info': 'info',
      'warning': 'warning',
      'error': 'error'
    };
    
    // Exibe o alerta
    Swal.fire({
      title: title || this.getDefaultTitle(type),
      text: message,
      icon: iconMap[type] as any,
      timer: timeout > 0 ? timeout : undefined,
      timerProgressBar: timeout > 0,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3B82F6'
    }).then((result) => {
      if (result.isConfirmed || result.isDismissed) {
        this.remove(id);
      }
    });
    
    return id;
  }

  /**
   * Exibe uma notificação de erro com opção de redirecionamento para a home
   */
  showErrorWithRedirect(
    message: string, 
    redirectPath = '/home',
    timeout = 5000,
    title = 'Erro'
  ): string {
    const id = this.generateId();
    
    Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      timer: timeout,
      timerProgressBar: true,
      showCancelButton: true,
      confirmButtonText: 'Ir para página inicial',
      cancelButtonText: 'Fechar',
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate([redirectPath]);
      }
    });
    
    // Se o timeout for definido, redireciona automaticamente após o tempo especificado
    if (timeout > 0) {
      setTimeout(() => {
        Swal.close();
        this.router.navigate([redirectPath]);
      }, timeout);
    }
    
    return id;
  }

  remove(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  clear(): void {
    this.notificationsSubject.next([]);
    Swal.close();
  }

  private getDefaultTitle(type: string): string {
    switch (type) {
      case 'success': return 'Sucesso';
      case 'info': return 'Informação';
      case 'warning': return 'Atenção';
      case 'error': return 'Erro';
      default: return 'Notificação';
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}
