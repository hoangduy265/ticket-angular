import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTicketModalComponent } from './view-ticket-modal.component';

describe('ViewTicketModalComponent', () => {
  let component: ViewTicketModalComponent;
  let fixture: ComponentFixture<ViewTicketModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewTicketModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewTicketModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
