import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DriveLinkService {

  constructor() { }

  /**
   * Convierte un enlace de Google Drive en una URL que se puede usar en un tag <img>
   * Soporta varios formatos de enlaces de Google Drive
   */
  convertDriveLink(driveLink: string): string {
    if (!driveLink || !driveLink.includes('drive.google.com')) {
      return driveLink; // Si no es un enlace de Drive, devolver el mismo
    }

    try {
      let fileId = '';

      // Enlace de visualización de tipo https://drive.google.com/file/d/FILE_ID/view
      if (driveLink.includes('/file/d/')) {
        const match = driveLink.match(/\/file\/d\/([^/]+)/);
        if (match && match[1]) {
          fileId = match[1];
        }
      } 
      // Enlace de tipo https://drive.google.com/open?id=FILE_ID
      else if (driveLink.includes('open?id=')) {
        const match = driveLink.match(/open\\?id=([^&]+)/);
        if (match && match[1]) {
          fileId = match[1];
        }
      }
      // Enlace de vista previa https://drive.google.com/uc?export=view&id=FILE_ID
      else if (driveLink.includes('uc?export=view')) {
        const match = driveLink.match(/id=([^&]+)/);
        if (match && match[1]) {
          fileId = match[1];
        }
      }
      // Enlace compartido con URL acortada
      else if (driveLink.includes('drive.google.com/drive/folders/')) {
        const match = driveLink.match(/folders\/([^?]+)/);
        if (match && match[1]) {
          fileId = match[1];
        }
      }

      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }

      return driveLink;
    } catch (error) {
      console.error('Error al procesar enlace de Drive:', error);
      return driveLink; // En caso de error, devolver el enlace original
    }
  }

  /**
   * Valida si un enlace es de Google Drive
   */
  isDriveLink(link: string): boolean {
    if (!link) return false;
    return link.includes('drive.google.com');
  }
}
