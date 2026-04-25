import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css'
})
export class RecipeListComponent implements OnInit { 
  private http = inject(HttpClient);

  searchTerm: string = '';
  szuroNyitva: boolean = false;
  kivalasztottRecept: any = null;

  // Ide mentjük majd a Java-ból érkező recepteket
  recipes: any[] = [];

  // Ez a függvény fut le automatikusan, amikor megnyitom az oldalt
  ngOnInit() {
    this.betoltes();
  }

  betoltes() {
    // Meghívom a Java végpontot (amit IntelliJ-ben írtam)
    this.http.get<any[]>('http://localhost:8080/api/receptek')
      .subscribe(adatok => {
        this.recipes = adatok;
        console.log('Receptek megérkeztek:', adatok);
      });
  }

  // A szűrési logikát egyszerűsítése (cím alapú keresés)
  get filteredRecipes() {
    return this.recipes.filter(recipe => {
      return recipe.title.toLowerCase().includes(this.searchTerm.toLowerCase());
    });
  }

  toggleSzuro() {
    this.szuroNyitva = !this.szuroNyitva;
  }
}