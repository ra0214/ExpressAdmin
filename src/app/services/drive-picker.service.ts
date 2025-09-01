import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Observable } from 'rxjs';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink: string;
  webContentLink?: string;
  imageUrl: string; // URL formateada para usar en la aplicación
}

@Injectable({
  providedIn: 'root'
})
export class DrivePickerService {
  private isBrowser: boolean;
  private isApiLoaded = false;
  private isClientLoaded = false;
  private isAuthorized = false;
  private tokenClient: any = null;
  
  // Reemplazar estos valores con tus credenciales reales de Google
  private readonly API_KEY = 'TU_API_KEY';
  private readonly CLIENT_ID = 'TU_CLIENT_ID';
  private readonly APP_ID = 'TU_APP_ID'; // Solo necesario para el Picker
  private readonly SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
  
  private selectedFilesSubject = new Subject<DriveFile[]>();
  public selectedFiles$ = this.selectedFilesSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.loadGapiAndGis();
    }
  }

  private loadGapiAndGis(): void {
    // Cargar Google API Client
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.onload = () => this.onGapiLoaded();
    document.body.appendChild(script1);

    // Cargar Google Identity Services
    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.onload = () => this.onGisLoaded();
    document.body.appendChild(script2);
  }

  private onGapiLoaded(): void {
    window.gapi.load('client:picker', () => {
      window.gapi.client.init({
        apiKey: this.API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
      }).then(() => {
        this.isApiLoaded = true;
      });
    });
  }

  private onGisLoaded(): void {
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: this.CLIENT_ID,
      scope: this.SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          this.isAuthorized = true;
          this.showPicker(tokenResponse.access_token);
        }
      },
      error_callback: (error: any) => {
        console.error('Error al autenticar con Google:', error);
      }
    });
  }

  public openPicker(): void {
    if (!this.isBrowser) {
      console.error('Esta función solo está disponible en el navegador');
      return;
    }

    if (!this.isApiLoaded || !this.tokenClient) {
      alert('La API de Google Drive aún se está cargando. Por favor, intenta nuevamente en unos segundos.');
      return;
    }

    this.tokenClient.requestAccessToken();
  }

  private showPicker(accessToken: string): void {
    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS_IMAGES);
    view.setMimeTypes('image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp');
    
    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .setAppId(this.APP_ID)
      .setOAuthToken(accessToken)
      .addView(view)
      .setDeveloperKey(this.API_KEY)
      .setCallback((data: any) => this.pickerCallback(data, accessToken))
      .build();
      
    picker.setVisible(true);
  }

  private pickerCallback(data: any, accessToken: string): void {
    if (data.action === window.google.picker.Action.PICKED) {
      const selectedFiles: DriveFile[] = [];
      
      const promises = data.docs.map((doc: any) => {
        return this.getFileDetails(doc.id, accessToken)
          .then((fileDetails: DriveFile) => {
            selectedFiles.push(fileDetails);
          });
      });
      
      Promise.all(promises).then(() => {
        this.selectedFilesSubject.next(selectedFiles);
      });
    }
  }

  private getFileDetails(fileId: string, accessToken: string): Promise<DriveFile> {
    return new Promise((resolve) => {
      window.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,thumbnailLink,webViewLink,webContentLink'
      }).then((response: any) => {
        const file = response.result;
        
        // Construir URL para usar en la aplicación
        // Esta URL permite mostrar la imagen de Google Drive en <img> tags
        const imageUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
        
        resolve({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          thumbnailLink: file.thumbnailLink,
          webViewLink: file.webViewLink,
          webContentLink: file.webContentLink,
          imageUrl: imageUrl
        });
      });
    });
  }

  public getSelectedFiles(): Observable<DriveFile[]> {
    return this.selectedFiles$;
  }
}
