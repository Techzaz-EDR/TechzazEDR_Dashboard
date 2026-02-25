import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    private baseUrl = 'http://127.0.0.1:8000';

    getHealth(): Observable<any> {
        return this.http.get(`${this.baseUrl}/health`);
    }

    getRoot(): Observable<any> {
        return this.http.get(`${this.baseUrl}/`);
    }
}
