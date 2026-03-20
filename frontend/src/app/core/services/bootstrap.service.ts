import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface BootstrapResponse {
  hostname: string;
  script_content: string;
  filename: string;
}

@Injectable({
  providedIn: 'root'
})
export class BootstrapService {
  private apiUrl = `${environment.apiUrl}/agents`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  generateBootstrapScript(hostname: string, osType: string = 'Windows', deviceType: string = 'Workstation'): Observable<BootstrapResponse> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return this.http.post<BootstrapResponse>(`${this.apiUrl}/bootstrap`, {
          hostname,
          os_type: osType,
          device_type: deviceType
        }, { headers });
      })
    );
  }
}
