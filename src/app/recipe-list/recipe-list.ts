import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  searchTerm: string = '';
  szuroNyitva: boolean = false;
  kivalasztottRecept: any = null;

  bejelentkezve: boolean = false;
  bejelentkezoAblakNyitva: boolean = false;
  kotelezoBejelentkezes: boolean = false; 
  loginAdatok = { email: '', jelszo: '' };

  urlapNyitva: boolean = false;
  ujReceptAdatok = {
    title: '',
    description: '',
    author: '',
    ido: 0,
    nehezseg: 'Könnyű',
    kategoria: '',
    kepUrl: ''
  };

  recipes: any[] = [];

  ngOnInit() {
    this.betoltes();
  }

  betoltes() {
    this.http.get<any[]>('http://localhost:8080/api/receptek')
      .subscribe(adatok => {
        this.recipes = adatok;
        console.log('Receptek megérkeztek:', adatok);
      });
  }

  kattintasBejelentkezesre() {
    if (this.bejelentkezve) {
      this.bejelentkezve = false;
      this.urlapNyitva = false;
      alert('Sikeres kijelentkezés! Várunk vissza!'); 
    } else {
      this.kotelezoBejelentkezes = false;
      this.bejelentkezoAblakNyitva = true;
    }
  }

  belepes() {
    if (this.loginAdatok.email !== '' && this.loginAdatok.jelszo !== '') {
      
      this.http.post<any>('http://localhost:8080/api/login', this.loginAdatok)
        .subscribe({
          next: (adatbazisFelhasznalo) => {
            this.bejelentkezve = true;
            this.bejelentkezoAblakNyitva = false; 
            this.loginAdatok = { email: '', jelszo: '' }; 
            this.cdr.detectChanges();

            setTimeout(() => {
              alert('Sikeres bejelentkezés! Üdvözlünk újra, ' + adatbazisFelhasznalo.username + '!'); 
            }, 150);
            
          },
          error: (hiba) => {
            console.error('Bejelentkezési hiba:', hiba);
            alert('Hibás e-mail cím vagy jelszó! Ellenőrizd az adatokat.');
          }
        });

    } else {
      alert('Töltsd ki az e-mailt és a jelszót is!');
    }
  }

  profilMegnyitas() {
    alert('Itt lesz a profilod! Később ide tehetjük a saját receptjeidet vagy a beállításokat.');
  }

  ujReceptKattintas() {
    if (this.bejelentkezve) {
      this.urlapNyitva = !this.urlapNyitva;
    } else {
      this.kotelezoBejelentkezes = true; 
      this.bejelentkezoAblakNyitva = true; 
    }
  }

  receptMentes() {
    this.http.post('http://localhost:8080/api/uj-recept', this.ujReceptAdatok)
      .subscribe({
        next: (valasz) => {
          alert('Sikeres mentés! Bekerült az adatbázisba.');
          this.betoltes();
          this.urlapNyitva = false;
          this.ujReceptAdatok = { title: '', description: '', author: '', ido: 0, nehezseg: 'Könnyű', kategoria: '', kepUrl: '' };
        },
        error: (hiba) => {
          console.error('Hiba a mentésnél:', hiba);
          alert('Nem sikerült elmenteni a receptet!');
        }
      });
  }

  get filteredRecipes() {
    return this.recipes.filter(recipe => {
      return recipe.title.toLowerCase().includes(this.searchTerm.toLowerCase());
    });
  }

  toggleSzuro() {
    this.szuroNyitva = !this.szuroNyitva;
  }
}