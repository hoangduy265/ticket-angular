import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RateTicketModalComponent } from './rate-ticket-modal.component';

describe('RateTicketModalComponent', () => {
  let component: RateTicketModalComponent;
  let fixture: ComponentFixture<RateTicketModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RateTicketModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RateTicketModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
