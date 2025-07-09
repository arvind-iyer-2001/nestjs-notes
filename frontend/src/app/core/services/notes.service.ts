import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Note {
  id: number;
  title: string;
  content: string;
  isPublic: boolean;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  isPublic?: boolean;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  isPublic?: boolean;
}

export interface GetNotesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface NotesResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private readonly API_URL = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getNotes(params?: GetNotesQueryParams): Observable<NotesResponse> {
    const headers = this.getAuthHeaders();
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search !== undefined) httpParams = httpParams.set('search', params.search);
      if (params.sortBy !== undefined) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder !== undefined) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }
    
    return this.http.get<NotesResponse>(`${this.API_URL}/notes`, { headers, params: httpParams });
  }

  getNoteById(id: number): Observable<Note> {
    const headers = this.getAuthHeaders();
    return this.http.get<Note>(`${this.API_URL}/notes/${id}`, { headers });
  }

  createNote(note: CreateNoteRequest): Observable<Note> {
    const headers = this.getAuthHeaders();
    return this.http.post<Note>(`${this.API_URL}/notes`, note, { headers });
  }

  updateNote(id: number, note: UpdateNoteRequest): Observable<Note> {
    const headers = this.getAuthHeaders();
    return this.http.put<Note>(`${this.API_URL}/notes/${id}`, note, { headers });
  }

  deleteNote(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.API_URL}/notes/${id}`, { headers });
  }

  shareNote(noteId: number, userEmail: string, permission: 'VIEW' | 'EDIT'): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.post<void>(`${this.API_URL}/notes/${noteId}/share`, {
      userEmail,
      permission
    }, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-api-key': 'your-secure-api-key-here'
    });
  }
}