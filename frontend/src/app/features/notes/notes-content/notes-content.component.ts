import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NotesService, Note } from '../../../core/services/notes.service';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';

@Component({
  selector: 'app-notes-content',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NotificationComponent],
  template: `
    <div class="notes-content">
      <div class="welcome-message" *ngIf="!currentNote">
        <h2>Welcome to Notes App</h2>
        <p>Select a note from the sidebar to start editing, or create a new note.</p>
      </div>

      <div class="note-editor" *ngIf="currentNote">
        <div class="note-toolbar">
          <div class="note-info">
            <span class="note-created">Created: {{ formatDate(currentNote.createdAt) }}</span>
            <span class="note-modified">Modified: {{ formatDate(currentNote.updatedAt) }}</span>
          </div>
          
          <div class="note-actions">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                [checked]="currentNote.isPublic"
                (change)="togglePublic($event)">
              <span>Public</span>
            </label>
            
            <button class="btn btn-secondary" (click)="shareNote()" title="Share">
              <span>📤 Share</span>
            </button>
          </div>
        </div>

        <form [formGroup]="noteForm">
          <div class="form-group">
            <input 
              type="text" 
              formControlName="title"
              placeholder="Note title..."
              class="title-input">
          </div>

          <div class="form-group">
            <textarea 
              formControlName="content"
              placeholder="Write your note here..."
              class="content-textarea"></textarea>
          </div>
        </form>

        <div class="save-status">
          <span *ngIf="saving" class="saving">Saving...</span>
          <span *ngIf="!saving && lastSaved" class="saved">Saved at {{ lastSaved }}</span>
        </div>
      </div>
    </div>

    <div class="share-modal" *ngIf="showShareModal" (click)="closeShareModal()">
      <div class="share-dialog" (click)="$event.stopPropagation()">
        <h3>Share Note</h3>
        <form [formGroup]="shareForm" (ngSubmit)="onShareSubmit()">
          <div class="form-group">
            <label for="userEmail">User Email:</label>
            <input 
              type="email" 
              id="userEmail" 
              formControlName="userEmail"
              placeholder="Enter email address">
          </div>
          
          <div class="form-group">
            <label for="permission">Permission:</label>
            <select id="permission" formControlName="permission">
              <option value="VIEW">View Only</option>
              <option value="EDIT">Can Edit</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="closeShareModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="shareForm.invalid">Share</button>
          </div>
        </form>
      </div>
    </div>

    <app-notification 
      [visible]="!!notificationMessage" 
      [type]="notificationType" 
      [message]="notificationMessage"
      (close)="notificationMessage = ''">
    </app-notification>
  `,
  styles: [`
    .notes-content {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .welcome-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: #666;
    }

    .welcome-message h2 {
      margin-bottom: 10px;
      color: #333;
    }

    .note-editor {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .note-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .note-info {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: #666;
    }

    .note-actions {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      font-size: 14px;
    }

    .checkbox-label input[type="checkbox"] {
      margin: 0;
    }

    .form-group {
      flex: none;
    }

    .title-input {
      width: 100%;
      padding: 20px;
      border: none;
      border-bottom: 1px solid #e0e0e0;
      font-size: 24px;
      font-weight: 600;
      color: #333;
      outline: none;
    }

    .title-input::placeholder {
      color: #999;
    }

    .content-textarea {
      width: 100%;
      flex: 1;
      padding: 20px;
      border: none;
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      resize: none;
      outline: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .content-textarea::placeholder {
      color: #999;
    }

    .save-status {
      padding: 10px 20px;
      font-size: 12px;
      color: #666;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }

    .saving {
      color: #007bff;
    }

    .saved {
      color: #28a745;
    }

    .share-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .share-dialog {
      background: white;
      padding: 20px;
      border-radius: 8px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .share-dialog h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #333;
    }

    .share-dialog .form-group {
      margin-bottom: 15px;
    }

    .share-dialog label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
    }

    .share-dialog input,
    .share-dialog select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-primary:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    @media (max-width: 768px) {
      .note-toolbar {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }

      .note-info {
        flex-direction: column;
        gap: 5px;
      }
    }
  `]
})
export class NotesContentComponent implements OnInit, OnDestroy {
  currentNote: Note | null = null;
  noteForm: FormGroup;
  shareForm: FormGroup;
  saving = false;
  lastSaved = '';
  showShareModal = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notesService: NotesService,
    private fb: FormBuilder
  ) {
    this.noteForm = this.fb.group({
      title: [''],
      content: ['']
    });

    this.shareForm = this.fb.group({
      userEmail: [''],
      permission: ['VIEW']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadNote(parseInt(params['id']));
      } else {
        this.currentNote = null;
      }
    });

    this.noteForm.valueChanges
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.currentNote) {
          this.saveNote();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNote(id: number): void {
    this.notesService.getNoteById(id).subscribe({
      next: (note) => {
        this.currentNote = note;
        this.noteForm.patchValue({
          title: note.title,
          content: note.content
        });
      },
      error: (error) => {
        console.error('Error loading note:', error);
        this.showNotification('Error loading note', 'error');
        this.router.navigate(['/notes']);
      }
    });
  }

  saveNote(): void {
    if (!this.currentNote) return;

    this.saving = true;
    const updateData = {
      title: this.noteForm.get('title')?.value,
      content: this.noteForm.get('content')?.value
    };

    this.notesService.updateNote(this.currentNote.id, updateData).subscribe({
      next: (updatedNote) => {
        this.currentNote = updatedNote;
        this.saving = false;
        this.lastSaved = new Date().toLocaleTimeString();
      },
      error: (error) => {
        console.error('Error saving note:', error);
        this.saving = false;
        this.showNotification('Error saving note', 'error');
      }
    });
  }

  togglePublic(event: Event): void {
    if (!this.currentNote) return;

    const target = event.target as HTMLInputElement;
    const updateData = { isPublic: target.checked };

    this.notesService.updateNote(this.currentNote.id, updateData).subscribe({
      next: (updatedNote) => {
        this.currentNote = updatedNote;
        this.showNotification(
          `Note is now ${updatedNote.isPublic ? 'public' : 'private'}`,
          'success'
        );
      },
      error: (error) => {
        console.error('Error updating note privacy:', error);
        target.checked = !target.checked;
        this.showNotification('Error updating note privacy', 'error');
      }
    });
  }

  shareNote(): void {
    this.showShareModal = true;
    this.shareForm.reset({ userEmail: '', permission: 'VIEW' });
  }

  closeShareModal(): void {
    this.showShareModal = false;
  }

  onShareSubmit(): void {
    if (!this.currentNote || this.shareForm.invalid) return;

    const { userEmail, permission } = this.shareForm.value;
    
    this.notesService.shareNote(this.currentNote.id, userEmail, permission).subscribe({
      next: () => {
        this.showNotification('Note shared successfully', 'success');
        this.closeShareModal();
      },
      error: (error) => {
        console.error('Error sharing note:', error);
        this.showNotification('Error sharing note', 'error');
      }
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    
    setTimeout(() => {
      this.notificationMessage = '';
    }, 5000);
  }
}