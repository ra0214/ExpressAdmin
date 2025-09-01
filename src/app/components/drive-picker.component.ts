import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrivePickerService, DriveFile } from '../services/drive-picker.service';

@Component({
  selector: 'app-drive-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="drive-picker-container">
      <div class="picker-header">
        <h3>
          <i class="fab fa-google-drive"></i>
          Seleccionar imagen de Google Drive
        </h3>
        <p class="help-text">Selecciona una imagen de tu Google Drive para usarla en la aplicación</p>
      </div>
      
      <div class="picker-actions">
        <button type="button" class="btn-drive" (click)="abrirSelector()">
          <i class="fab fa-google-drive"></i>
          Seleccionar de Google Drive
        </button>
      </div>
      
      <div class="selected-files" *ngIf="selectedFiles.length > 0">
        <h4>Imágenes seleccionadas:</h4>
        <div class="files-grid">
          <div class="file-card" *ngFor="let file of selectedFiles; let i = index">
            <div class="file-image">
              <img [src]="file.imageUrl" [alt]="file.name" (error)="onImageError($event)">
            </div>
            <div class="file-info">
              <p class="file-name">{{ truncateFilename(file.name, 20) }}</p>
              <div class="file-actions">
                <button class="btn-small" (click)="seleccionarImagen(file)">
                  <i class="fas fa-check"></i> Usar
                </button>
                <a [href]="file.webViewLink" target="_blank" class="btn-small">
                  <i class="fas fa-external-link-alt"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="selected-image-preview" *ngIf="imagenActual">
        <h4>Imagen seleccionada:</h4>
        <div class="preview-container">
          <img [src]="imagenActual.imageUrl" [alt]="imagenActual.name" (error)="onImageError($event)">
          <p class="image-name">{{ imagenActual.name }}</p>
          <button class="btn-clear" (click)="limpiarSeleccion()">
            <i class="fas fa-times"></i> Quitar selección
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drive-picker-container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .picker-header {
      margin-bottom: 16px;
    }

    .picker-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #4285f4;
      font-size: 18px;
    }

    .picker-header .help-text {
      margin-top: 4px;
      color: #666;
      font-size: 14px;
    }

    .btn-drive {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #4285f4;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .btn-drive:hover {
      background-color: #3367d6;
    }

    .selected-files {
      margin-top: 20px;
    }

    .selected-files h4 {
      margin-bottom: 12px;
      font-size: 16px;
      color: #333;
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
    }

    .file-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }

    .file-card:hover {
      transform: translateY(-3px);
    }

    .file-image {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #eee;
    }

    .file-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .file-info {
      padding: 10px;
    }

    .file-name {
      margin: 0 0 8px;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-actions {
      display: flex;
      gap: 6px;
    }

    .btn-small {
      padding: 4px 8px;
      font-size: 12px;
      background: #f1f1f1;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      color: #333;
      display: inline-flex;
      align-items: center;
    }

    .btn-small:hover {
      background: #e5e5e5;
    }

    .selected-image-preview {
      margin-top: 20px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .selected-image-preview h4 {
      margin-top: 0;
      margin-bottom: 12px;
      color: #333;
      font-size: 16px;
    }

    .preview-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .preview-container img {
      max-height: 200px;
      max-width: 100%;
      object-fit: contain;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 10px;
    }

    .image-name {
      margin: 8px 0;
      font-size: 14px;
      text-align: center;
    }

    .btn-clear {
      padding: 6px 12px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .btn-clear:hover {
      background: #d32f2f;
    }

    .placeholder-image {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 120px;
      background-color: #f0f0f0;
      color: #666;
      font-size: 14px;
      border-radius: 4px;
    }
  `]
})
export class DrivePickerComponent {
  @Input() imagenActualUrl: string = '';
  @Output() imageSelected = new EventEmitter<string>();
  
  selectedFiles: DriveFile[] = [];
  imagenActual: DriveFile | null = null;

  constructor(private drivePickerService: DrivePickerService) {
    this.drivePickerService.getSelectedFiles().subscribe(files => {
      this.selectedFiles = files;
      if (files.length > 0) {
        this.seleccionarImagen(files[0]);
      }
    });
  }

  abrirSelector(): void {
    this.drivePickerService.openPicker();
  }

  seleccionarImagen(file: DriveFile): void {
    this.imagenActual = file;
    this.imageSelected.emit(file.imageUrl);
  }

  limpiarSeleccion(): void {
    this.imagenActual = null;
    this.imageSelected.emit('');
  }

  truncateFilename(filename: string, maxLength: number): string {
    if (filename.length <= maxLength) return filename;
    
    const extension = filename.split('.').pop() || '';
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3) + '...';
    return truncatedName + '.' + extension;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" font-family="Arial,sans-serif" font-size="14" fill="%23666666" text-anchor="middle" dy="0.3em"%3EError%3C/text%3E%3C/svg%3E';
    }
  }
}
