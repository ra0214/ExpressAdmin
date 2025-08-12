import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {

  constructor() { }

  // Alerta de éxito
  success(title: string, text?: string): Promise<any> {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: text,
      confirmButtonColor: '#28a745',
      timer: 3000,
      timerProgressBar: true
    });
  }

  // Alerta de error
  error(title: string, text?: string): Promise<any> {
    return Swal.fire({
      icon: 'error',
      title: title,
      text: text,
      confirmButtonColor: '#dc3545'
    });
  }

  // Alerta de advertencia
  warning(title: string, text?: string): Promise<any> {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: text,
      confirmButtonColor: '#ffc107'
    });
  }

  // Alerta de información
  info(title: string, text?: string): Promise<any> {
    return Swal.fire({
      icon: 'info',
      title: title,
      text: text,
      confirmButtonColor: '#17a2b8'
    });
  }

  // Confirmación
  confirm(title: string, text?: string, confirmText: string = 'Sí, continuar'): Promise<any> {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545',
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancelar'
    });
  }

  // Confirmación de eliminación
  confirmDelete(item: string = 'este elemento'): Promise<any> {
    return Swal.fire({
      title: '¿Estás seguro?',
      text: `No podrás revertir esta acción. Se eliminará ${item} permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
  }

  // Loading/Toast
  loading(title: string = 'Procesando...', text?: string): void {
    Swal.fire({
      title: title,
      text: text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  // Cerrar loading
  close(): void {
    Swal.close();
  }

  // Toast notification
  toast(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: type,
      title: message
    });
  }

  // Input dialog
  input(title: string, inputType: 'text' | 'email' | 'password' | 'textarea' = 'text', placeholder?: string): Promise<any> {
    return Swal.fire({
      title: title,
      input: inputType,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Este campo es requerido';
        }
        return null;
      }
    });
  }
}
