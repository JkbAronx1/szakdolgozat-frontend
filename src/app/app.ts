import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RecipeListComponent } from './recipe-list/recipe-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RecipeListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Szakdolgozat App';
  hallgatoNeve = 'Jakab Áron';
}
