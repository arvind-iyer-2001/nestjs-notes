import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotesLayoutComponent } from './notes-layout/notes-layout.component';
import { NotesContentComponent } from './notes-content/notes-content.component';
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: NotesLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        component: NotesContentComponent
      },
      {
        path: 'note/:id',
        component: NotesContentComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotesRoutingModule {}