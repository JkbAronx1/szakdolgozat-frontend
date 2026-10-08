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

  // --- ÚJ SZŰRŐ ÉS RENDEZŐ VÁLTOZÓK ---
  kizarandoText: string = '';
  kotelezoText: string = '';
  kivalasztottRendezes: string = 'legujabb';

  // --- MIT EGYEK MA? (VÉLETLEN MÓD) ---
  veletlenMod: boolean = false;
  veletlenLista: any[] = [];

  // --- SAJÁT ÉS KÖZÖSSÉGI RECEPTEK MÓD ---
  sajatReceptekMod: boolean = false;
  kozossegiMod: boolean = false;

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

  // --- STÍLUSOS TÖRLÉSI MEGERŐSÍTÉS (MODALHOZ) ---
  megerositesAlattId: number | null = null;

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
      this.megerositesAlattId = null; // Záráskor elvetjük a törlési szándékot is
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

  // Évszak automatikus meghatározása
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

  tesztEvszakValtas(honapIndex: number) {
    this.meghatarozEvszakot(honapIndex);
    this.szezonMod = true;
    this.veletlenMod = false;
    this.sajatReceptekMod = false;
    this.kozossegiMod = false;
    this.jelenlegiOldal = 1;
    this.cdr.detectChanges();
  }

  toggleSzezonMod() {
    this.szezonMod = !this.szezonMod;
    if (this.szezonMod) {
      this.veletlenMod = false;
      this.sajatReceptekMod = false;
      this.kozossegiMod = false;
      this.jelenlegiOldal = 1;
    }
  }

  toggleSajatReceptek() {
    this.sajatReceptekMod = !this.sajatReceptekMod;
    this.kozossegiMod = false;
    this.veletlenMod = false;
    this.szezonMod = false;
    this.jelenlegiOldal = 1;
  }

  toggleKozossegiMod() {
    this.kozossegiMod = !this.kozossegiMod;
    this.sajatReceptekMod = false;
    this.veletlenMod = false;
    this.szezonMod = false;
    this.jelenlegiOldal = 1;
  }

  isSzezonalis(recept: any): boolean {
    const szoveg = `${recept.title || ''} ${recept.hozzavalok || ''} ${recept.description || ''}`.toLowerCase();
    return this.aktualisEvszak.kulcsszavak.some(kulcsszo => szoveg.includes(kulcsszo));
  }

 betoltes() {
    this.http.get<any[]>('http://localhost:8080/api/admin/receptek-kommentekkel')
      .subscribe({
        next: (adatok: any[]) => {
          this.recipes = (adatok || []).map(item => {
            const r = item.recept;
            r.hozzaszolasok = (item.kommentek || []).map((k: any) => ({
              ...k,
              felhasznalo: k.felhasznalo || k.author || k.username || 'Vendég'
            }));
            return r;
          });
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Hiba a receptek betöltésekor:', err)
      });
  }

  receptMegnyitasa(recept: any) {
    this.kivalasztottRecept = recept;
    this.alapAdag = recept.adag && recept.adag > 0 ? recept.adag : 4;
    this.aktualisAdag = this.alapAdag;
    this.megerositesAlattId = null; // Zárjuk le, ha esetleg nyitva maradt volna korábbról
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

    this.szurokTollese();

    const kevert = [...this.recipes].sort(() => 0.5 - Math.random());
    this.veletlenLista = kevert.slice(0, 6);
    this.veletlenMod = true;
    this.jelenlegiOldal = 1;
    this.cdr.detectChanges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

    this.kivalasztottRecept = null; 
    this.urlapNyitva = true; 
    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  // --- ÚJ TÖRLÉS LOGIKA (NEM BÖNGÉSZŐS CONFIRM) ---
  torlesiMezoserules(receptId: number) {
    this.megerositesAlattId = receptId;
  }

  megseTorles() {
    this.megerositesAlattId = null;
  }

  receptTorleseVegleges(recept: any) {
    this.http.delete(`http://localhost:8080/api/recept-torles/${recept.id}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.toastUzenet = 'Recept sikeresen törölve!';
          this.kivalasztottRecept = null;
          this.megerositesAlattId = null;
          this.betoltes();
          
          setTimeout(() => {
            this.toastUzenet = '';
            this.cdr.detectChanges();
          }, 3000);

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Hiba a recept törlésekor:', err);
          this.toastUzenet = 'Hiba történt a törlés során!';
          setTimeout(() => {
            this.toastUzenet = '';
            this.cdr.detectChanges();
          }, 3000);
        }
      });
  }

  urlapMegnyitasaUjhoz() {
    this.szerkesztesMod = false;
    this.szerkesztettReceptId = null;
    this.ujReceptAdatok = {
      title: '', description: '', author: '', ido: 0, nehezseg: 'Könnyű', kategoria: 'Főétel', kepUrl: '', ingredients: '', hozzavalok: '', adag: 4
    };
    this.urlapNyitva = !this.urlapNyitva;
  }

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
      author: megjelenithetoNev,
      ertekeles: this.ujErtekeles
    };

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
        
      },
      error: (err) => {
        console.error('Hiba a komment mentésekor', err);
        alert('Nem sikerült elmenteni a hozzászólást!');
      }
    });
  }

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

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        this.toastUzenet = 'Hibás e-mail cím formátum!';
        this.hibaIdozito();
        return;
      }

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
      this.kozossegiMod = false;

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
    // Kijavított mentési logika: Ha nincs bejelentkezve, ne küldjön "Ismeretlen"-t.
    this.ujReceptAdatok.author = this.bejelentkezettFelhasznaloNev || '';

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

  // ==========================================
  // KOMPLEX SZŰRÉS: OKOS RÉSZSZÓ KERESÉS SZINONIMÁKKAL ÉS SZERZŐKKEL
  // ==========================================
  get filteredRecipes() {
    if (this.veletlenMod) {
      return this.veletlenLista;
    }

    const szinonimak = [
      ['marha', 'marhahús', 'marhahus', 'darált marha', 'marhalábszár'],
      ['csirke', 'csirkemell', 'csirkecomb', 'csirkehús', 'csirkeszárny'],
      ['sertés', 'sertéshús', 'karaj', 'tarja', 'disznó', 'malac'],
      ['krumpli', 'burgonya', 'édesburgonya']
    ];

    const szoSzerepel = (szovegToKeres: string, keresoKifejezes: string): boolean => {
      if (!keresoKifejezes) return true;
      const tisztaSzo = keresoKifejezes.toLowerCase().trim();
      
      let keresendoSzavak = [tisztaSzo]; 
      for (const csoport of szinonimak) {
        if (csoport.some(sz => sz.includes(tisztaSzo) || tisztaSzo.includes(sz))) {
           keresendoSzavak = csoport;
           break;
        }
      }
      return keresendoSzavak.some(szo => szovegToKeres.includes(szo));
    };

    let szurtLista = this.recipes.filter(recipe => {
      
      // 1. SZERZŐ (ALAP, SAJÁT VAGY KÖZÖSSÉGI VIZSGÁLAT)
      const szerzo = recipe.author ? recipe.author.trim() : '';
      let forrasEgyezik = false;
      
      if (this.sajatReceptekMod) {
        forrasEgyezik = (szerzo.toLowerCase() === this.bejelentkezettFelhasznaloNev.toLowerCase());
      } else if (this.kozossegiMod) {
        forrasEgyezik = (szerzo !== '');
      } else {
        forrasEgyezik = (szerzo === '');
      }

      if (!forrasEgyezik) return false;

      // 2. ALAP SZŰRŐK
      const receptSzovege = `${recipe.title || ''} ${recipe.hozzavalok || ''} ${recipe.description || ''}`.toLowerCase();
      const egyezikSzezon = !this.szezonMod || this.isSzezonalis(recipe);
      const egyezikKategoria = this.szuroKategoria === '' || (recipe.kategoria && recipe.kategoria.toLowerCase() === this.szuroKategoria.toLowerCase());
      const egyezikNehezseg = this.szuroNehezseg === '' || (recipe.nehezseg && recipe.nehezseg === this.szuroNehezseg);
      const egyezikIdo = this.szuroIdo === null || this.szuroIdo === undefined || (recipe.ido && recipe.ido <= this.szuroIdo);

      // 3. SZÖVEGES KERESŐK
      const egyezikNev = szoSzerepel(receptSzovege, this.searchTerm);

      const kotelezoSzavak = this.kotelezoText.split(',').filter(s => s.trim().length > 0);
      const egyezikKotelezo = kotelezoSzavak.every(szo => szoSzerepel(receptSzovege, szo));

      const kizarandoSzavak = this.kizarandoText.split(',').filter(s => s.trim().length > 0);
      const egyezikKizarando = kizarandoSzavak.length === 0 || !kizarandoSzavak.some(szo => szoSzerepel(receptSzovege, szo));

      return egyezikSzezon && egyezikNev && egyezikKategoria && egyezikNehezseg && egyezikIdo && egyezikKotelezo && egyezikKizarando;
    });

    // 4. RENDEZÉS
    if (this.kivalasztottRendezes === 'ido_asc') {
      szurtLista.sort((a, b) => (a.ido || 999) - (b.ido || 999));
    } else if (this.kivalasztottRendezes === 'ido_desc') {
      szurtLista.sort((a, b) => (b.ido || 0) - (a.ido || 0));
    } else {
      szurtLista.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return szurtLista;
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
    this.szuroKategoria = ''; 
    this.szuroNehezseg = ''; 
    this.szuroIdo = null; 
    this.searchTerm = ''; 
    this.veletlenMod = false; 
    this.szezonMod = false; 
    this.sajatReceptekMod = false;
    this.kozossegiMod = false;
    this.kizarandoText = ''; 
    this.kotelezoText = ''; 
    this.kivalasztottRendezes = 'legujabb';
    this.jelenlegiOldal = 1;
  }

  toggleSzuro() { 
    this.szuroNyitva = !this.szuroNyitva; 
  }
}