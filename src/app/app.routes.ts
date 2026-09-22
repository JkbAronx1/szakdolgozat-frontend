import { Routes } from '@angular/router';
import { RecipeListComponent } from './recipe-list/recipe-list';
import { AdminPanelComponent } from './admin-panel/admin-panel';

export const routes: Routes = [
  { path: '', component: RecipeListComponent },
  { path: 'admin', component: AdminPanelComponent }
];