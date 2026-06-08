import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { RecipeItemComponent } from '../recipe-item/recipe-item'; 

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RecipeItemComponent],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css'
})
export class RecipeListComponent implements OnInit { 
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  // --- ALAP ADATOK ---
  searchTerm: string = '';
  szuroNyitva: boolean = false;
  kivalasztottRecept: any = null;

  szuroKategoria: string = '';
  szuroNehezseg: string = '';
  szuroIdo: number | null = null; 

  // --- FELHASZNÁLÓI ADATOK ---
  bejelentkezve: boolean = false;
  bejelentkezettFelhasznaloNev: string = ''; 
  bejelentkezoAblakNyitva: boolean = false;
  kotelezoBejelentkezes: boolean = false; 
  loginAdatok = { email: '', jelszo: '' };

  regisztraciosAblakNyitva: boolean = false;
  regAdatok = { username: '', email: '', jelszo: '', jelszoUjra: '' };

  urlapNyitva: boolean = false;
  ujReceptAdatok = {
    title: '', description: '', author: '', ido: 0, nehezseg: 'Könnyű', kategoria: '', kepUrl: ''
  };

  // --- KOMMENT ÉS ÉRTÉKELÉS VÁLTOZÓK ---
  ujErtekeles: number = 0;
  ujHozzaszolasText: string = '';

  // --- RECEPTEK ÉS LAPOZÁS ---
  recipes: any[] = [];
  jelenlegiOldal: number = 1;
  receptekOldalankent: number = 21;

  ngOnInit() {
    this.betoltes();
  }

  betoltes() {
    this.http.get<any[]>('http://localhost:8080/api/receptek')
      .subscribe(adatok => {
        this.recipes = adatok || []; 
        this.cdr.detectChanges(); 
      });
  }

  // --- KOMMENT ÉS ÉRTÉKELÉS MENTÉSE (Dinamikus névvel) ---
  hozzaszolasKuld() {
    if (!this.kivalasztottRecept) return;
    
    // Ellenőrzés: minimum egyiknek meg kell lennie
    if (this.ujErtekeles === 0 && this.ujHozzaszolasText.trim() === '') {
      alert("Kérlek, adj meg egy értékelést VAGY írj egy hozzászólást!");
      return;
    }

    if (!this.kivalasztottRecept.hozzaszolasok) {
      this.kivalasztottRecept.hozzaszolasok = [];
    }

    // Név meghatározása
    const megjelenithetoNev = this.bejelentkezve ? this.bejelentkezettFelhasznaloNev : "Vendég";

    this.kivalasztottRecept.hozzaszolasok.unshift({
      felhasznalo: megjelenithetoNev, 
      ertekeles: this.ujErtekeles,
      szoveg: this.ujHozzaszolasText.trim()
    });

    this.ujErtekeles = 0;
    this.ujHozzaszolasText = '';
  }

  // --- AZONOSÍTÁS ÉS REGISZTRÁCIÓ ---
  megnyitRegisztracio() {
    this.bejelentkezoAblakNyitva = false;
    this.regisztraciosAblakNyitva = true;
  }

  megnyitBejelentkezes() {
    this.regisztraciosAblakNyitva = false;
    this.bejelentkezoAblakNyitva = true;
  }

  regisztracio() {
    if (this.regAdatok.username && this.regAdatok.email && this.regAdatok.jelszo && this.regAdatok.jelszoUjra) {
      if (this.regAdatok.jelszo !== this.regAdatok.jelszoUjra) {
        alert('Hiba: A két jelszó nem egyezik meg!');
        return;
      }

      const formData = new FormData();
      formData.append('username', this.regAdatok.username);
      formData.append('email', this.regAdatok.email);
      formData.append('password', this.regAdatok.jelszo);

      this.http.post('http://localhost:8080/api/uj-felhasznalo', formData, { responseType: 'text' })
        .subscribe({
          next: (valasz) => {
            alert(valasz); 
            this.regisztraciosAblakNyitva = false;
            this.bejelentkezoAblakNyitva = true; 
            this.regAdatok = { username: '', email: '', jelszo: '', jelszoUjra: '' }; 
          },
          error: (hiba) => { alert('Hiba történt a regisztráció során!'); }
        });
    } else {
      alert('Kérlek, minden mezőt tölts ki!');
    }
  }

  kattintasBejelentkezesre() {
    if (this.bejelentkezve) {
      this.bejelentkezve = false;
      this.urlapNyitva = false;
      alert('Sikeres kijelentkezés!'); 
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
            this.bejelentkezettFelhasznaloNev = adatbazisFelhasznalo.username; // Név mentése
            this.bejelentkezoAblakNyitva = false; 
            this.loginAdatok = { email: '', jelszo: '' }; 
            this.cdr.detectChanges();
            alert('Sikeres bejelentkezés, ' + adatbazisFelhasznalo.username + '!'); 
          },
          error: () => { alert('Hibás e-mail cím vagy jelszó!'); }
        });
    } else {
      alert('Töltsd ki a mezőket!');
    }
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
        next: () => {
          alert('Sikeres mentés!');
          this.betoltes();
          this.urlapNyitva = false;
          this.ujReceptAdatok = { title: '', description: '', author: '', ido: 0, nehezseg: 'Könnyű', kategoria: '', kepUrl: '' };
        },
        error: () => { alert('Nem sikerült elmenteni!'); }
      });
  }

  // --- SZŰRŐ ÉS LAPOZÁS LOGIKA ---
  get filteredRecipes() {
    return this.recipes.filter(recipe => {
      const egyezikNev = recipe.title.toLowerCase().includes(this.searchTerm.toLowerCase());
      const egyezikKategoria = this.szuroKategoria === '' || (recipe.kategoria && recipe.kategoria.toLowerCase() === this.szuroKategoria.toLowerCase());
      const egyezikNehezseg = this.szuroNehezseg === '' || (recipe.nehezseg && recipe.nehezseg === this.szuroNehezseg);
      const egyezikIdo = this.szuroIdo === null || this.szuroIdo === undefined || (recipe.ido && recipe.ido <= this.szuroIdo);
      return egyezikNev && egyezikKategoria && egyezikNehezseg && egyezikIdo;
    });
  }

  get paginatedRecipes() {
    const kezdoIndex = (this.jelenlegiOldal - 1) * this.receptekOldalankent;
    const vegIndex = kezdoIndex + this.receptekOldalankent;
    return this.filteredRecipes.slice(kezdoIndex, vegIndex);
  }

  get osszesOldal() {
    return Math.ceil(this.filteredRecipes.length / this.receptekOldalankent) || 1;
  }

  kovetkezoOldal() {
    if (this.jelenlegiOldal < this.osszesOldal) {
      this.jelenlegiOldal++;
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }
  }

  elozoOldal() {
    if (this.jelenlegiOldal > 1) {
      this.jelenlegiOldal--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  szurokTollese() {
    this.szuroKategoria = ''; this.szuroNehezseg = ''; this.szuroIdo = null; this.searchTerm = '';
  }

  toggleSzuro() { this.szuroNyitva = !this.szuroNyitva; }
}