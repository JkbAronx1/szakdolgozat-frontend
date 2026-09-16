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

  // --- TOAST ÜZENET (Jobb felső sarok) ---
  toastUzenet: string = '';

  jelszoLathato: boolean = false;

  toggleJelszoMutatasa() {
    this.jelszoLathato = !this.jelszoLathato;
  }

  urlapNyitva: boolean = false;
  ujReceptAdatok = {
    title: '', description: '', author: '', ido: 0, nehezseg: 'Könnyű', kategoria: 'Főétel', kepUrl: '', ingredients: '', hozzavalok: ''
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

  // --- LOKÁLIS KÉP KIVÁLASZTÁSA ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.ujReceptAdatok.kepUrl = reader.result as string; 
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  // --- KOMMENT ÉS ÉRTÉKELÉS MENTÉSE ---
  hozzaszolasKuld() {
    if (!this.kivalasztottRecept) return;
    
    if (this.ujErtekeles === 0 && this.ujHozzaszolasText.trim() === '') {
      alert("Kérlek, adj meg egy értékelést VAGY írj egy hozzászólást!");
      return;
    }

    if (!this.kivalasztottRecept.hozzaszolasok) {
      this.kivalasztottRecept.hozzaszolasok = [];
    }

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
      
      if (!this.regAdatok.email.includes('@')) {
        this.toastUzenet = 'Hibás e-mail cím';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.toastUzenet = '';
          this.cdr.detectChanges();
        }, 5000);
        return;
      }

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
            this.regisztraciosAblakNyitva = false;
            this.bejelentkezoAblakNyitva = true; 
            this.regAdatok = { username: '', email: '', jelszo: '', jelszoUjra: '' }; 

            this.toastUzenet = valasz || 'Sikeres regisztráció!';
            this.cdr.detectChanges();

            setTimeout(() => {
              this.toastUzenet = '';
              this.cdr.detectChanges();
            }, 5000);
          },
          error: (hiba) => { alert('Hiba történt a regisztráció során!'); }
        });
    } else {
      alert('Kérlek, minden mezőt tölts ki!');
    }
  }

  kattintasBejelentkezesre() {
    if (this.bejelentkezve) {
      const felhasznaloNev = this.bejelentkezettFelhasznaloNev;
      this.bejelentkezve = false;
      this.bejelentkezettFelhasznaloNev = '';
      this.urlapNyitva = false; 

      this.toastUzenet = 'Viszontlátásra, ' + (felhasznaloNev || 'Felhasználó') + '! Sikeres kijelentkezés.';
      this.cdr.detectChanges();

      setTimeout(() => {
        this.toastUzenet = '';
        this.cdr.detectChanges();
      }, 5000);

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
            this.bejelentkezettFelhasznaloNev = adatbazisFelhasznalo.username; 
            this.loginAdatok = { email: '', jelszo: '' }; 

            this.bejelentkezoAblakNyitva = false; 

            this.toastUzenet = 'Sikeres bejelentkezés, ' + adatbazisFelhasznalo.username + '!';
            this.cdr.detectChanges();

            setTimeout(() => {
              this.toastUzenet = '';
              this.cdr.detectChanges();
            }, 5000);
          },
          error: () => {
            this.toastUzenet = 'Hibás e-mail cím vagy jelszó';
            this.cdr.detectChanges();

            setTimeout(() => {
              this.toastUzenet = '';
              this.cdr.detectChanges();
            }, 5000);
          }
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
    this.ujReceptAdatok.author = this.bejelentkezettFelhasznaloNev || 'Ismeretlen';

    this.http.post('http://localhost:8080/api/uj-recept', this.ujReceptAdatok)
      .subscribe({
        next: () => {
          this.toastUzenet = 'Sikeres receptfeltöltés!';
          this.cdr.detectChanges();
          setTimeout(() => {
            this.toastUzenet = '';
            this.cdr.detectChanges();
          }, 5000);

          this.betoltes();
          this.urlapNyitva = false;
          this.ujReceptAdatok = { title: '', description: '', author: '', ido: 0, nehezseg: 'Könnyű', kategoria: 'Főétel', kepUrl: '', ingredients: '', hozzavalok: '' };
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