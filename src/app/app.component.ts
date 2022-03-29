import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { Item } from './classes/item';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'angular-autocomplete_multiselect';

  selectedFruits = new FormControl(null, Validators.required);

  allFruits: Item[] = [
    { value: 1, viewValue: 'Apple' },
    { value: 2, viewValue: 'Lemon' },
    { value: 3, viewValue: 'Lime' },
    { value: 4, viewValue: 'Orange' },
    { value: 5, viewValue: 'Strawberry' },
  ];

}
