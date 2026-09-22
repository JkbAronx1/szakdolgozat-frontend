import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
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

  // --- MIT EGYEK MA? (VÉLETLEN MÓD) ---
  veletlenMod: boolean = false;
  veletlenLista: any[] = [];

  // --- SAJÁT RECEPTEK MÓD ---
  sajatReceptekMod: boolean = false;

  // --- SZEZONÁLIS ÉTELEK VÁLTOZÓI ---
  szezonMod: boolean = false;
  aktualisEvszak: { nev: string; emoji: string; szin: string; kulcsszavak: string[] } = {
    nev: 'Ősz',
    emoji: '🍂',
    szin: '#fab1a0',
    kulcsszavak: []
  };

  // --- ADAGSZÁMLÁLÓ RÉSZLETEKHEZ ---
  aktualisAdag: number = 4;
  alapAdag: number = 4;

  // --- FELHASZNÁLÓI ADATOK ---
  bejelentkezve: boolean = false;
  bejelentkezettFelhasznaloNev: string = ''; 
  bejelentkezoAblakNyitva: boolean = false;
  kotelezoBejelentkezes: boolean = false; 
  loginAdatok = { email: '', jelszo: '' };

  regisztraciosAblakNyitva: boolean = false;
  regAdatok = { username: '', email: '', jelszo: '', jelszoUjra: '' };

  // --- TOAST ÜZENET ---
  toastUzenet: string = '';

  jelszoLathato: boolean = false;

  toggleJelszoMutatasa() {
    this.jelszoLathato = !this.jelszoLathato;
  }

  // --- ŰRLAP ÉS SZERKESZTÉSI ÁLLAPOT ---
  urlapNyitva: boolean = false;
  szerkesztesMod: boolean = false;
  szerkesztettReceptId: number | null = null;

  ujReceptAdatok = {
    title: '', description: '', author: '', ido: 0, nehezseg: 'Könnyű', kategoria: 'Főétel', kepUrl: '', ingredients: '', hozzavalok: '', adag: 4
  };

  // --- KOMMENT ÉS ÉRTÉKELÉS VÁLTOZÓK ---
  ujErtekeles: number = 0;
  ujHozzaszolasText: string = '';

  // --- RECEPTEK ÉS LAPOZÁS ---
  recipes: any[] = [];
  jelenlegiOldal: number = 1;
  receptekOldalankent: number = 21;

  // --- ESCAPE BILLENTYŰ FIGYELÉSE A MODALOK BEZÁRÁSÁHOZ ---
  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.kivalasztottRecept) {
      this.kivalasztottRecept = null;
    } else if (this.bejelentkezoAblakNyitva) {
      this.bejelentkezoAblakNyitva = false;
    } else if (this.regisztraciosAblakNyitva) {
      this.regisztraciosAblakNyitva = false;
    }
  }

  ngOnInit() {
    this.meghatarozEvszakot();
    this.betoltes();
  }

  // Évszak automatikus meghatározása (vagy teszt esetén manuális hónap beállítása)
  meghatarozEvszakot(kenyszeritettHonap?: number) {
    const honap = kenyszeritettHonap !== undefined ? kenyszeritettHonap : new Date().getMonth();

    if (honap >= 2 && honap <= 4) {
      this.aktualisEvszak = {
        nev: 'Tavasz',
        emoji: '🌱',
        szin: '#55efc4',
        kulcsszavak: ['medvehagyma', 'eper', 'retek', 'spárga', 'újhagyma', 'spenót', 'borsó', 'zöldborsó', 'saláta']
      };
    } else if (honap >= 5 && honap <= 7) {
      this.aktualisEvszak = {
        nev: 'Nyár',
        emoji: '☀️',
        szin: '#ffeaa7',
        kulcsszavak: ['lecsó', 'dinnye', 'cukkini', 'padlizsán', 'paradicsom', 'málna', 'barack', 'fagyi', 'grill', 'uborka', 'kukorica']
      };
    } else if (honap >= 8 && honap <= 10) {
      this.aktualisEvszak = {
        nev: 'Ősz',
        emoji: '🍂',
        szin: '#fab1a0',
        kulcsszavak: ['sütőtök', 'tök', 'szilva', 'alma', 'dió', 'gesztenye', 'gomba', 'fahéj', 'szőlő', 'körte']
      };
    } else {
      this.aktualisEvszak = {
        nev: 'Tél',
        emoji: '❄️',
        szin: '#74b9ff',
        kulcsszavak: ['káposzta', 'kocsonya', 'narancs', 'mézeskalács', 'lencse', 'forralt bor', 'leves', 'bab', 'mandarin']
      };
    }
  }

  // --- TESZT VEZÉRLŐ METÓDUSOK A FELÜLETRŐL VALÓ VÁLTÁSHOZ ---
  tesztEvszakValtas(honapIndex: number) {
    this.meghatarozEvszakot(honapIndex);
    this.szezonMod = true;
    this.veletlenMod = false;
    this.sajatReceptekMod = false;
    this.jelenlegiOldal = 1;
    this.cdr.detectChanges();
  }

  toggleSzezonMod() {
    this.szezonMod = !this.szezonMod;
    if (this.szezonMod) {
      this.veletlenMod = false;
      this.sajatReceptekMod = false;
      this.jelenlegiOldal = 1;
    }
  }

  toggleSajatReceptek() {
    this.sajatReceptekMod = !this.sajatReceptekMod;
    this.veletlenMod = false;
    this.szezonMod = false;
    this.jelenlegiOldal = 1;
  }

  // Kulcsszó keresés a recept szövegeiben
  isSzezonalis(recept: any): boolean {
    const szoveg = `${recept.title || ''} ${recept.hozzavalok || ''} ${recept.description || ''}`.toLowerCase();
    return this.aktualisEvszak.kulcsszavak.some(kulcsszo => szoveg.includes(kulcsszo));
  }

  betoltes() {
    this.http.get<any[]>('http://localhost:8080/api/receptek')
      .subscribe(adatok => {
        this.recipes = adatok || []; 
        this.cdr.detectChanges(); 
      });
  }

  receptMegnyitasa(recept: any) {
    this.kivalasztottRecept = recept;
    this.alapAdag = recept.adag && recept.adag > 0 ? recept.adag : 4;
    this.aktualisAdag = this.alapAdag;
  }

  novelAdag() {
    this.aktualisAdag++;
  }

  csokkentAdag() {
    if (this.aktualisAdag > 1) {
      this.aktualisAdag--;
    }
  }

  szamoltHozzavalo(sor: string): string {
    const tisztaSor = sor.trim();
    const match = tisztaSor.match(/^([0-9]+(?:[.,][0-9]+)?)(.*)$/);

    if (match) {
      const eredetiMennyiseg = parseFloat(match[1].replace(',', '.'));
      const maradekSzoveg = match[2];

      if (!isNaN(eredetiMennyiseg)) {
        const arany = this.aktualisAdag / this.alapAdag;
        const ujMennyiseg = Number((eredetiMennyiseg * arany).toFixed(2));
        return `${ujMennyiseg}${maradekSzoveg}`;
      }
    }

    return tisztaSor;
  }

  // --- ELKÉSZÍTÉS AUTOMATIKUS LÉPÉSEKRE BONTÁSA ---
  formazottLepesek(leiras: string): string[] {
    if (!leiras) return [];

    const nyersSorok = leiras.split('\n').map(s => s.trim()).filter(s => s.length > 0);

    if (nyersSorok.length > 1) {
      return nyersSorok.map(sor => sor.replace(/^[0-9]+[.)]\s*/, '').trim());
    }

    const tisztaSzoveg = nyersSorok[0] || '';
    const mondatok = tisztaSzoveg
      .split(/(?<=[.!?])\s+/)
      .map(m => m.trim())
      .filter(m => m.length > 0);

    if (mondatok.length <= 1) {
      return [tisztaSzoveg.replace(/^[0-9]+[.)]\s*/, '').trim()];
    }

    const lepesek: string[] = [];
    let jelenlegiLepes = '';
    let mondatSzamlalo = 0;

    mondatok.forEach((mondat) => {
      const tisztaMondat = mondat.replace(/^[0-9]+[.)]\s*/, '').trim();
      jelenlegiLepes += (jelenlegiLepes ? ' ' : '') + tisztaMondat;
      mondatSzamlalo++;

      if (mondatSzamlalo >= 2 && jelenlegiLepes.length > 60) {
        lepesek.push(jelenlegiLepes);
        jelenlegiLepes = '';
        mondatSzamlalo = 0;
      }
    });

    if (jelenlegiLepes) {
      lepesek.push(jelenlegiLepes);
    }

    return lepesek;
  }

  // --- MIT EGYEK MA? LOGIKA ---
  toggleVeletlenMod() {
    if (this.veletlenMod) {
      this.veletlenMod = false;
      this.jelenlegiOldal = 1;
    } else {
      this.ujVeletlenValogatas();
    }
  }

  ujVeletlenValogatas() {
    if (this.recipes.length === 0) {
      alert("Nincsenek receptek az oldalon!");
      return;
    }

    this.szuroKategoria = '';
    this.szuroNehezseg = '';
    this.szuroIdo = null;
    this.searchTerm = '';
    this.szezonMod = false;
    this.sajatReceptekMod = false;

    const kevert = [...this.recipes].sort(() => 0.5 - Math.random());
    this.veletlenLista = kevert.slice(0, 6);
    this.veletlenMod = true;
    this.jelenlegiOldal = 1;
    this.cdr.detectChanges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- KÉP KEZELÉS ---
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

  kepTorlese() {
    this.ujReceptAdatok.kepUrl = '';
    const kepInput = document.getElementById('kepInput') as HTMLInputElement;
    if (kepInput) {
      kepInput.value = ''; 
    }
  }

  // --- RECEPT MÓDOSÍTÁSA ÉS TÖRLÉSE ---
  receptSzerkesztesreMegnyit(recept: any) {
    this.szerkesztesMod = true;
    this.szerkesztettReceptId = recept.id;
    this.ujReceptAdatok = {
      title: recept.title || '',
      description: recept.description || '',
      author: recept.author || this.bejelentkezettFelhasznaloNev,
      ido: recept.ido || 0,
      nehezseg: recept.nehezseg || 'Könnyű',
      kategoria: recept.kategoria || 'Főétel',
      kepUrl: recept.kepUrl || '',
      ingredients: recept.ingredients || '',
      hozzavalok: recept.hozzavalok || '',
      adag: recept.adag || 4
    };

    this.kivalasztottRecept = null; // Részletek modal bezárása
    this.urlapNyitva = true; // Űrlap kinyitása
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  receptTorles(recept: any) {
    if (confirm(`Biztosan törölni szeretnéd a(z) "${recept.title}" receptet?`)) {
      this.http.delete(`http://localhost:8080/api/recept-torles/${recept.id}`, { responseType: 'text' })
        .subscribe({
          next: () => {
            this.toastUzenet = 'Recept sikeresen törölve!';
            this.kivalasztottRecept = null;
            this.betoltes();
            this.cdr.detectChanges();
            setTimeout(() => {
              this.toastUzenet = '';
              this.cdr.detectChanges();
            }, 4000);
          },
          error: () => {
            alert('Hiba történt a törlés során!');
          }
        });
    }
  }

  urlapMegnyitasaUjhoz() {
    this.szerkesztesMod = false;
    this.szerkesztettReceptId = null;
    this.ujReceptAdatok = {
      title: '', description: '', author: '', ido: 0, nehezseg: 'Könnyű', kategoria: 'Főétel', kepUrl: '', ingredients: '', hozzavalok: '', adag: 4
    };
    this.urlapNyitva = !this.urlapNyitva;
  }

  // --- KOMMENT ÉS ÉRTÉKELÉS MENTÉSE ---
  hozzaszolasKuld() {
    if (!this.kivalasztottRecept) return;
    
    if (this.ujErtekeles === 0 && this.ujHozzaszolasText.trim() === '') {
      alert("Kérlek, adj meg egy értékelést VAGY írj egy hozzászólást!");
      return;
    }

    const megjelenithetoNev = this.bejelentkezve ? this.bejelentkezettFelhasznaloNev : "Vendég";

    const kommentAdat = {
      receptId: this.kivalasztottRecept.id,
      szoveg: this.ujHozzaszolasText.trim(),
      author: megjelenithetoNev
    };

    // Elküldjük a backendnek, hogy lementse az adatbázisba
    this.http.post('http://localhost:8080/api/comments', kommentAdat).subscribe({
      next: (res: any) => {
        if (!this.kivalasztottRecept.hozzaszolasok) {
          this.kivalasztottRecept.hozzaszolasok = [];
        }

        this.kivalasztottRecept.hozzaszolasok.unshift({
          felhasznalo: megjelenithetoNev, 
          ertekeles: this.ujErtekeles,
          szoveg: this.ujHozzaszolasText.trim()
        });

        this.ujErtekeles = 0;
        this.ujHozzaszolasText = '';
        this.cdr.detectChanges();
        
        console.log('Komment sikeresen elmentve az adatbázisba!', res);
      },
      error: (err) => {
        console.error('Hiba a komment mentésekor', err);
        alert('Nem sikerült elmenteni a hozzászólást!');
      }
    });
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
      const email = this.regAdatok.email.trim().toLowerCase();

      if (email.includes(',')) {
        this.toastUzenet = 'Hibás e-mail cím: kérlek, vessző helyett pontot használj!';
        this.hibaIdozito();
        return;
      }

      if (!email.includes('@')) {
        this.toastUzenet = 'Hibás e-mail cím: hiányzik a @ karakter!';
        this.hibaIdozito();
        return;
      }

      const tiltottElgepelesek = [
        'gmal.com', 'gamil.com', 'gmai.com', 'gmial.com', 'gail.com',
        'fremil.hu', 'freemail.h', 'fremail.u', 'freml.hu', 'fremail.com',
        'hotmai.com', 'hotnail.com', 'hotmaill.com',
        'outlok.com', 'outlooik.com',
        'yaho.com', 'yahooo.com'
      ];

      const domainResz = email.split('@')[1];
      if (tiltottElgepelesek.includes(domainResz)) {
        this.toastUzenet = `Úgy tűnik, elgépelted az e-mail címet (${domainResz})!`;
        this.hibaIdozito();
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        this.toastUzenet = 'Hibás e-mail cím formátum!';
        this.hibaIdozito();
        return;
      }

      // --- ITT CSERÉLTÜK LE AZ ALERTET TOASTRA ---
      if (this.regAdatok.jelszo !== this.regAdatok.jelszoUjra) {
        this.toastUzenet = 'Hiba: A két jelszó nem egyezik meg!';
        this.hibaIdozito();
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
            this.hibaIdozito();
          },
          error: () => { 
            this.toastUzenet = 'Hiba történt a regisztráció során!'; 
            this.hibaIdozito();
          }
        });
    } else {
      // --- ITT IS LECSERÉLTÜK AZ ALERTET TOASTRA ---
      this.toastUzenet = 'Kérlek, minden mezőt tölts ki!';
      this.hibaIdozito();
    }
  }

  
  hibaIdozito() {
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastUzenet = '';
      this.cdr.detectChanges();
    }, 5000);
  }

  kattintasBejelentkezesre() {
    if (this.bejelentkezve) {
      const felhasznaloNev = this.bejelentkezettFelhasznaloNev;
      this.bejelentkezve = false;
      this.bejelentkezettFelhasznaloNev = '';
      this.urlapNyitva = false; 
      this.sajatReceptekMod = false;

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
      this.urlapMegnyitasaUjhoz();
    } else {
      this.kotelezoBejelentkezes = true; 
      this.bejelentkezoAblakNyitva = true; 
    }
  }

  receptMentes() {
    this.ujReceptAdatok.author = this.bejelentkezettFelhasznaloNev || 'Ismeretlen';

    if (this.szerkesztesMod && this.szerkesztettReceptId) {
      this.http.put(`http://localhost:8080/api/recept-modositas/${this.szerkesztettReceptId}`, this.ujReceptAdatok, { responseType: 'text' })
        .subscribe({
          next: () => {
            this.toastUzenet = 'Recept sikeresen frissítve!';
            this.cdr.detectChanges();
            setTimeout(() => {
              this.toastUzenet = '';
              this.cdr.detectChanges();
            }, 4000);

            this.betoltes();
            this.urlapNyitva = false;
            this.szerkesztesMod = false;
            this.szerkesztettReceptId = null;
            this.ujReceptAdatok = { title: '', description: '', author: '', ido: 0, nehezseg: 'Könnyű', kategoria: 'Főétel', kepUrl: '', ingredients: '', hozzavalok: '', adag: 4 };
          },
          error: () => { alert('Nem sikerült módosítani a receptet!'); }
        });
    } else {
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
            this.ujReceptAdatok = { title: '', description: '', author: '', ido: 0, nehezseg: 'Könnyű', kategoria: 'Főétel', kepUrl: '', ingredients: '', hozzavalok: '', adag: 4 };
            
            const kepInput = document.getElementById('kepInput') as HTMLInputElement;
            if (kepInput) {
              kepInput.value = '';
            }
          },
          error: () => { alert('Nem sikerült elmenteni!'); }
        });
    }
  }

  // --- SZŰRŐ ÉS LAPOZÁS LOGIKA ---
  get filteredRecipes() {
    if (this.veletlenMod) {
      return this.veletlenLista;
    }

    return this.recipes.filter(recipe => {
      const egyezikSajat = !this.sajatReceptekMod || (recipe.author && recipe.author.toLowerCase() === this.bejelentkezettFelhasznaloNev.toLowerCase());
      const egyezikSzezon = !this.szezonMod || this.isSzezonalis(recipe);
      const egyezikNev = recipe.title.toLowerCase().includes(this.searchTerm.toLowerCase());
      const egyezikKategoria = this.szuroKategoria === '' || (recipe.kategoria && recipe.kategoria.toLowerCase() === this.szuroKategoria.toLowerCase());
      const egyezikNehezseg = this.szuroNehezseg === '' || (recipe.nehezseg && recipe.nehezseg === this.szuroNehezseg);
      const egyezikIdo = this.szuroIdo === null || this.szuroIdo === undefined || (recipe.ido && recipe.ido <= this.szuroIdo);

      return egyezikSajat && egyezikSzezon && egyezikNev && egyezikKategoria && egyezikNehezseg && egyezikIdo;
    });
  }

  get paginatedRecipes() {
    if (this.veletlenMod) {
      return this.veletlenLista;
    }

    const kezdoIndex = (this.jelenlegiOldal - 1) * this.receptekOldalankent;
    const vegIndex = kezdoIndex + this.receptekOldalankent;
    return this.filteredRecipes.slice(kezdoIndex, vegIndex);
  }

  get osszesOldal() {
    if (this.veletlenMod) {
      return 1;
    }
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
    this.szuroKategoria = ''; this.szuroNehezseg = ''; this.szuroIdo = null; this.searchTerm = ''; this.veletlenMod = false; this.szezonMod = false; this.sajatReceptekMod = false;
  }

  toggleSzuro() { this.szuroNyitva = !this.szuroNyitva; }
}