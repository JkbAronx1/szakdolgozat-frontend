import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeListComponent } from './recipe-list';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

describe('RecipeList - Regisztrációs Logika Tesztek', () => {
  let component: RecipeListComponent;
  let fixture: ComponentFixture<RecipeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeListComponent, HttpClientTestingModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Létre kell jönnie a komponensnek', () => {
    expect(component).toBeTruthy();
  });

  it('Hibát kell dobnia, ha az e-mail címben vessző van', () => {
    component.regAdatok = {
      username: 'TesztElek',
      email: 'teszt,elek@gmail.com',
      jelszo: 'titkos123',
      jelszoUjra: 'titkos123'
    };

    component.regisztracio();

    expect(component.toastUzenet).toBe('Hibás e-mail cím: kérlek, vessző helyett pontot használj!');
  });

  it('Hibát kell dobnia, ha a felhasználó elgépeli a gmail-t (pl. gmal.com)', () => {
    component.regAdatok = {
      username: 'TesztElek',
      email: 'teszt@gmal.com',
      jelszo: 'titkos123',
      jelszoUjra: 'titkos123'
    };

    component.regisztracio();

    expect(component.toastUzenet).toContain('Úgy tűnik, elgépelted az e-mail címet (gmal.com)!');
  });

  it('Hibát kell dobnia, ha a két jelszó nem egyezik', () => {
    component.regAdatok = {
      username: 'TesztElek',
      email: 'teszt@gmail.com',
      jelszo: 'titkos123',
      jelszoUjra: 'masikJelszo'
    };

    component.regisztracio();

    expect(component.toastUzenet).toBe('Hiba: A két jelszó nem egyezik meg!');
  });
});