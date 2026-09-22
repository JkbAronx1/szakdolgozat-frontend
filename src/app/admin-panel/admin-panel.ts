import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css'
})
export class AdminPanelComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  receptekAdatok: any[] = [];
  toastUzenet: string = '';

  ngOnInit() {
    this.adatokBetoltese();
  }

  adatokBetoltese() {
    this.http.get<any[]>('http://localhost:8080/api/admin/receptek-kommentekkel')
      .subscribe({
        next: (data) => {
          this.receptekAdatok = data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Hiba az admin adatok betöltésekor', err)
      });
  }

  receptTorles(id: number, cim: string) {
    this.http.delete(`http://localhost:8080/api/recept-torles/${id}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.adatokBetoltese();
          this.mutatToast(`A(z) "${cim}" recept sikeresen törölve!`);
        },
        error: () => {
          this.mutatToast('Hiba történt a recept törlése során!');
        }
      });
  }

  kommentTorles(commentId: number) {
    this.http.delete(`http://localhost:8080/api/admin/comment-torles/${commentId}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.adatokBetoltese();
          this.mutatToast('Hozzászólás sikeresen törölve!');
        },
        error: () => {
          this.mutatToast('Hiba történt a hozzászólás törlése során!');
        }
      });
  }

  mutatToast(uzenet: string) {
    this.toastUzenet = uzenet;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastUzenet = '';
      this.cdr.detectChanges();
    }, 4000);
  }
}