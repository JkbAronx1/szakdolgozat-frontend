import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RecipeItemComponent } from '../recipe-item/recipe-item';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RecipeItemComponent],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanelComponent implements OnInit {
  
  recipesWithComments: any[] = [];
  kivalasztottRecept: any = null;
  aktualisAdag: number = 4;
  alapAdag: number = 4;

  toastUzenet: string = '';
  kozossegiMod: boolean = false;
  urlapNyitva: boolean = false;
  szerkesztesMod: boolean = false;
  szerkesztettReceptId: number | null = null;

  jelenlegiOldal: number = 1;
  receptekOldalankent: number = 21;

  ujReceptAdatok = {
    title: '', description: '', author: 'Hivatalos alap recept', ido: 0, nehezseg: 'Könnyű', kategoria: 'Főétel', kepUrl: '', ingredients: '', hozzavalok: '', adag: 4
  };

  // Jelezzük, hogy melyik receptnél megy a törlés megerősítése
  megerositesAlattId: number | null = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.kivalasztottRecept) {
      this.kivalasztottRecept = null;
      this.megerositesAlattId = null;
    }
  }

  ngOnInit(): void {
    this.betoltes();
  }

  betoltes() {
    this.http.get<any[]>('http://localhost:8080/api/admin/receptek-kommentekkel')
      .subscribe({
        next: (adatok) => {
          this.recipesWithComments = (adatok || []).map(item => {
            // Biztosítjuk, hogy a név és a csillagos értékelés is helyesen átjöjjön a szerverről
            item.kommentek = (item.kommentek || []).map((k: any) => ({
              ...k,
              felhasznalo: k.felhasznalo || k.author || k.username || 'Vendég',
              // Itt ellenőrizzük az összes lehetséges mezőnevet, amin a backend küldheti az értékelést
              ertekeles: k.ertekeles !== undefined ? k.ertekeles : (k.rating !== undefined ? k.rating : (k.csillag !== undefined ? k.csillag : 0))
            }));
            return item;
          });

          if (this.kivalasztottRecept) {
            const friss = this.recipesWithComments.find(item => item.recept.id === this.kivalasztottRecept.id);
            if (friss) {
              this.kivalasztottRecept = friss.recept;
              this.kivalasztottRecept.hozzaszolasok = friss.kommentek;
            }
          }
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Hiba az admin adatok lekérdezésekor:', err)
      });
  }

  toggleKozossegiMod() {
    this.kozossegiMod = !this.kozossegiMod;
    this.jelenlegiOldal = 1;
  }

  ujReceptKattintas() {
    this.urlapMegnyitasaUjhoz();
  }

  urlapMegnyitasaUjhoz() {
    this.urlapNyitva = !this.urlapNyitva;
    this.szerkesztesMod = false;
    this.szerkesztettReceptId = null;
    this.ujReceptAdatok = {
      title: '', description: '', author: 'Hivatalos alap recept', ido: 0, nehezseg: 'Könnyű', kategoria: 'Főétel', kepUrl: '', ingredients: '', hozzavalok: '', adag: 4
    };
  }

  receptSzerkesztesreMegnyit(recept: any) {
    this.szerkesztesMod = true;
    this.szerkesztettReceptId = recept.id;
    this.urlapNyitva = true;
    this.ujReceptAdatok = {
      title: recept.title || '',
      description: recept.description || '',
      author: recept.author || 'Hivatalos alap recept',
      ido: recept.ido || 0,
      nehezseg: recept.nehezseg || 'Könnyű',
      kategoria: recept.kategoria || 'Főétel',
      kepUrl: recept.kepUrl || '',
      ingredients: recept.ingredients || '',
      hozzavalok: recept.hozzavalok || '',
      adag: recept.adag || 4
    };
    this.kivalasztottRecept = null;
  }

  receptMentes() {
    if (this.szerkesztesMod && this.szerkesztettReceptId) {
      this.http.put(`http://localhost:8080/api/recept-modositas/${this.szerkesztettReceptId}`, this.ujReceptAdatok, { responseType: 'text' })
        .subscribe({
          next: () => {
            this.toastUzenet = 'Sikeres mentés!';
            this.urlapNyitva = false;
            this.szerkesztesMod = false;
            this.szerkesztettReceptId = null;
            this.betoltes();
            setTimeout(() => {
              this.toastUzenet = '';
              this.cdr.detectChanges();
            }, 4000);
          },
          error: (err) => {
            alert('Hiba történt a módosítás során!');
            console.error(err);
          }
        });
    } else {
      this.http.post('http://localhost:8080/api/uj-recept', this.ujReceptAdatok)
        .subscribe({
          next: () => {
            this.toastUzenet = 'Sikeres receptfeltöltés!';
            this.urlapNyitva = false;
            this.betoltes();
            setTimeout(() => {
              this.toastUzenet = '';
              this.cdr.detectChanges();
            }, 5000);
          },
          error: (err) => {
            alert('Nem sikerült elmenteni!');
            console.error(err);
          }
        });
    }
  }

  // --- STÍLUSOS TÖRLÉSI MEGERŐSÍTÉS LOGIKA ---
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

  kommentTorlese(index: number, komment: any) {
    this.http.delete(`http://localhost:8080/api/admin/comment-torles/${komment.id}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.toastUzenet = 'Értékelés sikeresen törölve!';
          this.betoltes();
          setTimeout(() => {
            this.toastUzenet = '';
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (err) => console.error('Hiba a komment törlésekor:', err)
      });
  }

  receptMegnyitasa(recept: any) {
    this.kivalasztottRecept = recept;
    this.alapAdag = recept.adag && recept.adag > 0 ? recept.adag : 4;
    this.aktualisAdag = this.alapAdag;
  }

  visszaAFooldalra() {
    window.location.href = '/';
  }

  get filteredRecipes() {
    const list = this.recipesWithComments.map(item => {
      const r = item.recept;
      r.hozzaszolasok = item.kommentek;
      return r;
    });

    let szurtLista = list.filter(recipe => {
      const szerzo = recipe.author ? recipe.author.trim() : '';
      if (this.kozossegiMod) {
        return szerzo !== '' && szerzo !== 'Hivatalos alap recept';
      } else {
        return szerzo === '' || szerzo === 'Hivatalos alap recept';
      }
    });

    szurtLista.sort((a, b) => (b.id || 0) - (a.id || 0));
    return szurtLista;
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

  csokkentAdag() {
    if (this.aktualisAdag > 1) this.aktualisAdag--;
  }

  novelAdag() {
    this.aktualisAdag++;
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
    return leiras.split('\n').map(s => s.trim()).filter(s => s.length > 0);
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

}