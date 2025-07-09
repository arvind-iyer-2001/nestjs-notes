import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/notes',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'notes',
    loadChildren: () => import('./features/notes/notes.module').then(m => m.NotesModule)
  },
  {
    path: '**',
    redirectTo: '/notes'
  }
];
