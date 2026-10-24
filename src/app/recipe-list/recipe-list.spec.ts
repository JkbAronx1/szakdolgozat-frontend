import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeListComponent } from './recipe-list';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

describe('RecipeList - Komponens és Logika Tesztek', () => {
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
    component.regAdatok = { username: 'TesztElek', email: 'teszt,elek@gmail.com', jelszo: 'titkos123', jelszoUjra: 'titkos123' };
    component.regisztracio();
    expect(component.toastUzenet).toBe('Hibás e-mail cím: kérlek, vessző helyett pontot használj!');
  });

  it('Hibát kell dobnia, ha hiányzik a @ karakter az e-mailből', () => {
    component.regAdatok = { username: 'TesztElek', email: 'tesztelekgmail.com', jelszo: 'titkos123', jelszoUjra: 'titkos123' };
    component.regisztracio();
    expect(component.toastUzenet).toBe('Hibás e-mail cím: hiányzik a @ karakter!');
  });

  it('Hibát kell dobnia, ha a felhasználó elgépeli a szolgáltatót (pl. gmal.com)', () => {
    component.regAdatok = { username: 'TesztElek', email: 'teszt@gmal.com', jelszo: 'titkos123', jelszoUjra: 'titkos123' };
    component.regisztracio();
    expect(component.toastUzenet).toBe('Úgy tűnik, elgépelted az e-mail címet (gmal.com)!');
  });

  it('Hibát kell dobnia, ha a két jelszó nem egyezik', () => {
    component.regAdatok = { username: 'TesztElek', email: 'teszt@gmail.com', jelszo: 'titkos123', jelszoUjra: 'masikJelszo' };
    component.regisztracio();
    expect(component.toastUzenet).toBe('Hiba: A két jelszó nem egyezik meg!');
  });

  it('Dinamikus adagszámító: helyesen kell arányosítania a törtszámokat is', () => {
    component.alapAdag = 4;
    component.aktualisAdag = 6;
    
    const eredmeny = component.szamoltHozzavalo('1.5 kg finomliszt');
    expect(eredmeny).toBe('2.25 kg finomliszt');
  });

  it('Okosszűrő: a kötelező hozzávalókat szigorúan kell szűrnie szinonimákkal', () => {
    component.recipes = [
      { id: 1, title: 'Marhapörkölt', hozzavalok: 'hagyma, marhalábszár, paprika' },
      { id: 2, title: 'Csirke leves', hozzavalok: 'csirkemell, répa, hagyma' }
    ];
    
    component.kotelezoText = 'marha';
    component.veletlenMod = false; 

    const szurt = component.filteredRecipes;
    
    expect(szurt.length).toBe(1);
    expect(szurt[0].title).toBe('Marhapörkölt');
  });
});