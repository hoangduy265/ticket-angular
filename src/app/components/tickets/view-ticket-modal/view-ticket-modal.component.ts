import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../modal.component/modal.component';
import { Ticket, TicketService, TicketImage } from '../../../services/ticket.service';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-view-ticket-modal',
  imports: [CommonModule, ModalComponent],
  templateUrl: './view-ticket-modal.component.html',
  styleUrl: './view-ticket-modal.component.css',
})
export class ViewTicketModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() ticket: Ticket | null = null;
  @Input() isOpen = false;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<Ticket>();
  @Output() statusChangeRequested = new EventEmitter<{ ticket: Ticket; newStatus: number }>();
  @Output() rateRequested = new EventEmitter<Ticket>();

  // Ticket images
  ticketImages: TicketImage[] = [];
  isLoadingImages = false;
  imgUrl = environment.imgUrl;

  // Image preview modal
  selectedImage: TicketImage | null = null;
  showImageModal = false;

  // RxJS cleanup
  private destroy$ = new Subject<void>();

  // Options cho status dropdown (chỉ để hiển thị)
  statusOptions = [
    { value: 0, label: 'Mới tạo' },
    { value: 1, label: 'Đang xử lý' },
    { value: 2, label: 'Hoàn thành' },
    { value: 3, label: 'Treo' },
  ];

  // Options cho type (chỉ để hiển thị)
  typeOptions = [
    { value: 1, label: 'Phần cứng' },
    { value: 2, label: 'Phần mềm' },
    { value: 3, label: 'Mạng' },
    { value: 4, label: 'Camera - Chấm công' },
    { value: 5, label: 'Máy in' },
    { value: 6, label: 'PM văn phòng' },
    { value: 7, label: 'PM thiết kế' },
    { value: 8, label: 'Khác' },
  ];

  constructor(private ticketService: TicketService) {}

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.showImageModal) {
      this.closeImagePreview();
    }
  }

  ngOnInit(): void {
    if (this.ticket) {
      this.loadTicketImages();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticket'] && this.ticket) {
      this.loadTicketImages();
    }
  }

  private loadTicketImages(): void {
    if (!this.ticket?.id) return;

    this.isLoadingImages = true;
    this.ticketService
      .getTicketImages(this.ticket.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (images) => {
          this.ticketImages = images;
          this.isLoadingImages = false;
          console.log('✅ Loaded ticket images for view:', images);
        },
        error: (error) => {
          console.error('❌ Failed to load ticket images:', error);
          this.isLoadingImages = false;
          this.ticketImages = [];
        },
      });
  }

  onClose(): void {
    this.modalClosed.emit();
  }

  onEdit(): void {
    if (this.ticket && this.canEdit()) {
      this.editRequested.emit(this.ticket);
    }
  }

  onChangeStatus(newStatus: number): void {
    if (this.ticket) {
      this.statusChangeRequested.emit({ ticket: this.ticket, newStatus });
    }
  }

  onRate(): void {
    if (this.ticket && this.canRate()) {
      this.rateRequested.emit(this.ticket);
    }
  }

  // Helper methods
  canEdit(): boolean {
    return this.ticket?.status === 0;
  }

  canRate(): boolean {
    return this.ticket?.status === 2 && !this.ticket.rate;
  }

  canChangeStatus(): boolean {
    // Có thể thêm logic phức tạp hơn ở đây
    return true;
  }

  getStatusLabel(status?: number): string {
    const statusLabels: { [key: number]: string } = {
      0: 'Mới tạo',
      1: 'Đang xử lý',
      2: 'Hoàn thành',
      3: 'Treo',
    };
    return statusLabels[status || 0] || 'Không xác định';
  }

  getTypeLabel(type?: number): string {
    if (!type) return 'Chưa xác định';
    const typeOption = this.typeOptions.find((opt) => opt.value === type);
    return typeOption?.label || 'Không xác định';
  }

  getStatusClass(status?: number): string {
    const statusClasses: { [key: number]: string } = {
      0: 'bg-gray-100 text-gray-800',
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
    };
    return statusClasses[status || 0] || 'bg-gray-100 text-gray-800';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch {
      return dateString;
    }
  }

  getRatingStars(rating?: number): string {
    if (!rating) return 'Chưa đánh giá';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  openImagePreview(image: TicketImage): void {
    // Hiển thị modal preview ảnh trong chính modal
    this.selectedImage = image;
    this.showImageModal = true;
  }

  closeImagePreview(): void {
    this.showImageModal = false;
    this.selectedImage = null;
  }

  downloadImage(image: TicketImage): void {
    const imageUrl = `${this.imgUrl}/${image.imageUrl}`;
    window.open(imageUrl, '_blank');
  }
}
