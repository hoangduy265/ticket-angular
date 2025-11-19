import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditTicketModalComponent } from './edit-ticket-modal.component';

describe('EditTicketModalComponent', () => {
  let component: EditTicketModalComponent;
  let fixture: ComponentFixture<EditTicketModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTicketModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTicketModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
