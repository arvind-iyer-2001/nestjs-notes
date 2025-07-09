import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { NotesRoutingModule } from './notes-routing.module';

import { NotesListComponent } from './notes-list/notes-list.component';
import { NotesContentComponent } from './notes-content/notes-content.component';
import { NotesLayoutComponent } from './notes-layout/notes-layout.component';

@NgModule({
  imports: [
    SharedModule,
    NotesRoutingModule,
    NotesListComponent,
    NotesContentComponent,
    NotesLayoutComponent
  ]
})
export class NotesModule {}