import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../modal.component/modal.component';
import { Ticket } from '../../../services/ticket.service';

@Component({
  selector: 'app-rate-ticket-modal',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './rate-ticket-modal.component.html',
  styleUrl: './rate-ticket-modal.component.css',
})
export class RateTicketModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() ticket: Ticket | null = null;
  @Output() rated = new EventEmitter<{ ticketId: number; rating: number }>();
  @Output() closed = new EventEmitter<void>();

  selectedRating = 0;
  isSubmitting = false;

  get stars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  selectRating(rating: number): void {
    if (!this.ticket?.rate) {
      this.selectedRating = rating;
    }
  }

  isStarActive(star: number): boolean {
    return star <= this.selectedRating;
  }

  onSubmit(): void {
    if (this.selectedRating > 0 && this.ticket && !this.ticket.rate && !this.isSubmitting) {
      this.isSubmitting = true;
      this.rated.emit({
        ticketId: this.ticket.id,
        rating: this.selectedRating,
      });
    }
  }

  onClose(): void {
    this.selectedRating = 0;
    this.isSubmitting = false;
    this.closed.emit();
  }

  // Reset component state when inputs change
  ngOnChanges(): void {
    if (this.ticket?.rate) {
      // If ticket is already rated, reset selection to prevent confusion
      this.selectedRating = 0;
    }
  }

  canRate(): boolean {
    return !!(this.ticket && this.ticket.status === 2 && !this.ticket.rate);
  }
}
