import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VietnamMapComponent } from './vietnam-map.component';

describe('VietnamMapComponent', () => {
  let component: VietnamMapComponent;
  let fixture: ComponentFixture<VietnamMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VietnamMapComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(VietnamMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});








































