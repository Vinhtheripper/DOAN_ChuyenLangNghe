import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisionMisionComponent } from './vision-mision.component';

describe('VisionMisionComponent', () => {
  let component: VisionMisionComponent;
  let fixture: ComponentFixture<VisionMisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VisionMisionComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(VisionMisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
