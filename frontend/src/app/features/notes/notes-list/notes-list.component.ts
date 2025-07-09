import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NotesService, Note } from '../../../core/services/notes.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, ConfirmDialogComponent],
  template: `
    <div class="notes-list">
      <div class="notes-header">
        <h2>Notes</h2>
        <button class="btn btn-primary" (click)="createNote()">
          <span>+ New Note</span>
        </button>
      </div>

      <div class="search-bar">
        <input 
          type="text" 
          placeholder="Search notes..." 
          [(ngModel)]="searchTerm"
          (input)="onSearchChange()"
          class="search-input">
      </div>

      <div class="notes-container">
        <app-loading-spinner *ngIf="loading" [size]="32" message="Loading notes..."></app-loading-spinner>
        
        <div *ngIf="!loading && notes.length === 0" class="empty-state">
          <p>No notes found</p>
          <button class="btn btn-primary" (click)="createNote()">Create your first note</button>
        </div>

        <div class="note-item" 
             *ngFor="let note of notes" 
             [class.active]="selectedNoteId === note.id"
             (click)="selectNote(note)">
          <div class="note-header">
            <h3>{{ note.title || 'Untitled' }}</h3>
            <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
          </div>
          <div class="note-preview">
            {{ getPreview(note.content) }}
          </div>
          <div class="note-actions">
            <span class="note-public" *ngIf="note.isPublic">Public</span>
            <button class="btn-icon" (click)="deleteNote(note, $event)" title="Delete">
              <span>🗑️</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <app-confirm-dialog
      [visible]="showDeleteDialog"
      [title]="'Delete Note'"
      [message]="'Are you sure you want to delete this note? This action cannot be undone.'"
      (confirm)="confirmDelete()"
      (cancel)="cancelDelete()">
    </app-confirm-dialog>
  `,
  styles: [`
    .notes-list {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .notes-header {
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e0e0e0;
    }

    .notes-header h2 {
      margin: 0;
      color: #333;
      font-size: 20px;
    }

    .search-bar {
      padding: 15px 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: #007bff;
    }

    .notes-container {
      flex: 1;
      overflow-y: auto;
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: #666;
    }

    .empty-state p {
      margin-bottom: 15px;
    }

    .note-item {
      padding: 15px 20px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .note-item:hover {
      background-color: #f8f9fa;
    }

    .note-item.active {
      background-color: #e3f2fd;
      border-left: 4px solid #007bff;
    }

    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .note-header h3 {
      margin: 0;
      font-size: 16px;
      color: #333;
      font-weight: 600;
      flex: 1;
      margin-right: 10px;
    }

    .note-date {
      font-size: 12px;
      color: #666;
      white-space: nowrap;
    }

    .note-preview {
      color: #666;
      font-size: 14px;
      line-height: 1.4;
      margin-bottom: 10px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .note-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .note-public {
      background: #28a745;
      color: white;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 3px;
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

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .btn-icon:hover {
      opacity: 1;
      background: #f0f0f0;
    }
  `]
})
export class NotesListComponent implements OnInit {
  notes: Note[] = [];
  loading = false;
  searchTerm = '';
  selectedNoteId: number | null = null;
  showDeleteDialog = false;
  noteToDelete: Note | null = null;

  constructor(
    private notesService: NotesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadNotes();
    this.route.params.subscribe(params => {
      this.selectedNoteId = params['id'] ? parseInt(params['id']) : null;
    });
  }

  loadNotes(): void {
    this.loading = true;
    const params = this.searchTerm ? { search: this.searchTerm } : {};
    
    this.notesService.getNotes(params).subscribe({
      next: (response) => {
        this.notes = response.notes;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notes:', error);
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    setTimeout(() => {
      this.loadNotes();
    }, 300);
  }

  selectNote(note: Note): void {
    this.selectedNoteId = note.id;
    this.router.navigate(['/notes/note', note.id]);
  }

  createNote(): void {
    const newNote = {
      title: '',
      content: '',
      isPublic: false
    };

    this.notesService.createNote(newNote).subscribe({
      next: (note) => {
        this.notes.unshift(note);
        this.selectNote(note);
      },
      error: (error) => {
        console.error('Error creating note:', error);
      }
    });
  }

  deleteNote(note: Note, event: Event): void {
    event.stopPropagation();
    this.noteToDelete = note;
    this.showDeleteDialog = true;
  }

  confirmDelete(): void {
    if (this.noteToDelete) {
      this.notesService.deleteNote(this.noteToDelete.id).subscribe({
        next: () => {
          this.notes = this.notes.filter(n => n.id !== this.noteToDelete!.id);
          if (this.selectedNoteId === this.noteToDelete!.id) {
            this.router.navigate(['/notes']);
          }
          this.cancelDelete();
        },
        error: (error) => {
          console.error('Error deleting note:', error);
          this.cancelDelete();
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteDialog = false;
    this.noteToDelete = null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  getPreview(content: string): string {
    if (!content) return 'No content';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }
}