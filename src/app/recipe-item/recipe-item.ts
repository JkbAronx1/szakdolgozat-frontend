import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recipe-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-item.html',
  styleUrl: './recipe-item.css'
})
export class RecipeItemComponent {
  @Input() recipe: any;
  @Output() cardClick = new EventEmitter<any>();

  kattintasTortent() {
    this.cardClick.emit(this.recipe);
  }
}