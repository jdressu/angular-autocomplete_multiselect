import { Component, ElementRef, Inject, Input, OnDestroy, Optional, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';

import { MatOptionSelectionChange } from '@angular/material/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatFormField, MatFormFieldControl, MAT_FORM_FIELD } from '@angular/material/form-field';
import { map, Observable, startWith, Subject } from 'rxjs';

import { Item } from 'src/app/classes/item';
import { Internal } from 'src/app/classes/internal';

@Component({
  selector: 'app-autocomplete-multiselect',
  templateUrl: './autocomplete-multiselect.component.html',
  styleUrls: ['./autocomplete-multiselect.component.scss'],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: AutocompleteMultiselectComponent,
    },
  ],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '[class.example-floating]': 'shouldLabelFloat',
    '[id]': 'id',
  },
})
export class AutocompleteMultiselectComponent 
implements
  ControlValueAccessor,
  MatFormFieldControl<Array<number | string>>,
  OnDestroy
{

  static nextId = 0;

  @Input() data!: Item[];

  @ViewChild('camInput') camInput!: ElementRef<HTMLInputElement>;
  @ViewChild('camInput', { read: MatAutocompleteTrigger }) autocomplete!: MatAutocompleteTrigger;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('aria-describedby') userAriaDescribedBy!: string;

  selectable = true;
  removable = true;

  separatorKeysCodes: number[] = [ENTER, COMMA];

  inputDataControl = new FormControl();

  filteredData: Observable<Item[]>;
  selectedData: Item[] = [];

  stateChanges = new Subject<void>();

  controlType = 'chips-autocomplete';

  focused = false;

  touched = false;

  id = `${this.controlType}-${AutocompleteMultiselectComponent.nextId++}`;

  get empty() {
    return !(this.selectedData?.length > 0);
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  private internal = new Internal();

  @Input()
  get placeholder(): string {
    return this.internal.placeholder;
  }

  set placeholder(value: string) {
    this.internal.placeholder = value;
    this.stateChanges.next();
  }

  @Input()
  get required(): boolean {
    return this.internal.required;
  }

  set required(value: boolean) {
    this.internal.required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  @Input()
  get disabled(): boolean {
    return this.internal.disabled;
  }

  set disabled(value: boolean) {
    this.internal.disabled = coerceBooleanProperty(value);
    if (this.internal.disabled) {
      this.inputDataControl.disable();
    } else {
      this.inputDataControl.enable();
    }
    this.stateChanges.next();
  }

  @Input()
  get value(): Array<number | string> | null {
    if (this.selectedData?.length > 0) {
      return this.selectedData.map((s) => s.value);
    }
    return null;
  }

  set value(_selectedData: Array<number | string> | null) {
    const selectedValues = _selectedData || [];
    this.selectValues(selectedValues);
    this.stateChanges.next();
  }

  get errorState(): boolean {
    return (this.ngControl.invalid ?? false) && this.touched;
  }

  constructor(
    private focusMonitor: FocusMonitor,
    private elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl
  ) {
    this.internal.required = false;
    this.internal.disabled = false;

    this.filteredData = this.inputDataControl.valueChanges.pipe(
      startWith(null),
      map((value: string | null) =>
        value ? this.filter(value) : this.data ? this.data.slice() : []
      )
    );

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this.focusMonitor.stopMonitoring(this.elementRef);
  }

  selection(event: MatOptionSelectionChange, data: Item) {
    console.log('stuff');
    this.toggleSelection(data);
    this.autocomplete.openPanel();
  }

  add(event: MatChipInputEvent): void {
    const value = event.value;
    console.log('add', value);

    this.autocomplete.openPanel();

    this.clearFilter();
  }

  remove(data: Item): void {
    this.toggleSelection(data);
    this.clearFilter();
  }

  optionClicked(event: Event, data: Item): void {
    event.stopPropagation();
    this.toggleSelection(data);
    this.clearFilter();
  }

  toggleSelection(data: Item) {
    if (this.disabled) {
      return;
    }

    let index = this.selectedData?.indexOf(data);

    if (index >= 0) {
      this.data.push(this.selectedData.splice(index, 1)[0]);
    } else {
      index = this.data.indexOf(data);
      if (index >= 0) {
        if (this.selectedData === undefined) {
          this.selectedData = [];
        }
        this.selectedData.push(this.data.splice(index, 1)[0]);
      }
    }

    this.onChange(this.value);
  }

  clearSelection(event: Event) {
    event.stopPropagation();
    while (this.selectedData?.length > 0) {
      this.toggleSelection(this.selectedData[0]);
    }
    this.clearFilter();
  }

  selectValues(selectValues: Array<number | string>) {
    console.log(selectValues);
  }

  clearFilter() {
    this.camInput.nativeElement.value = '';
    this.inputDataControl.setValue(null);
    this.onContainerClick();
  }

  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(_value: Array<number | string> | null): void {
    this.value = _value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onFocusIn(event: FocusEvent) {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(event: FocusEvent) {
    if (
      !this.elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  setDescribedByIds(ids: string[]) {
    const controlElement = this.elementRef.nativeElement.querySelector(
      '.autocomplete-multiselect'
    );
    if (controlElement) {
      controlElement.setAttribute('aria-describedby', ids.join(' '));
    }
  }

  onContainerClick(event?: MouseEvent) {
    // console.log('onContainerClick');
    setTimeout(() => {
      this.focusMonitor.focusVia(this.camInput, 'program');
    });
  }

  private filter(value: number | string): Array<Item> {

    let filteredValues: Array<Item> = [];

    if (typeof value === 'string') {

      const filterValue = value ? value.toLowerCase() : '';

      const values = this.data.filter((data) =>
        data.viewValue.toLowerCase().includes(filterValue)
      );

      if (values !== undefined) { filteredValues = values; }

    }

    return filteredValues;

  }

}
