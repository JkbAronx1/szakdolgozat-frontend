import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeItem } from './recipe-item';

describe('RecipeItem', () => {
  let component: RecipeItem;
  let fixture: ComponentFixture<RecipeItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeItem],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
