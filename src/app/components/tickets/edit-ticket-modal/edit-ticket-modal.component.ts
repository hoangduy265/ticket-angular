import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalComponent } from '../../modal.component/modal.component';
import { Ticket, TicketService, TicketImage } from '../../../services/ticket.service';
import { ToastService } from '../../toast/toast.service';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-edit-ticket-modal',
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './edit-ticket-modal.component.html',
  styleUrl: './edit-ticket-modal.component.css',
})
export class EditTicketModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() ticket: Ticket | null = null;
  @Input() isOpen = false;
  @Output() ticketUpdated = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  ticketForm: FormGroup;
  isSubmitting = false;

  // Existing images from server
  existingImages: TicketImage[] = [];
  isLoadingImages = false;

  // Multi-image upload properties
  selectedFiles: File[] = [];
  imagePreviews: { file: File; url: string; name: string }[] = [];
  maxImages = 3;

  // Image URL base
  imgUrl = environment.imgUrl;

  // RxJS cleanup
  private destroy$ = new Subject<void>();

  // Options cho type dropdown
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

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private toastService: ToastService
  ) {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(1000)]],
      type: [null, [Validators.required]],
      note: ['', [Validators.maxLength(255)]],
      assignedTo: [null],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    // Khi ticket thay đổi, populate form
    if (this.ticket) {
      this.populateForm();
      this.loadTicketImages();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Khi ticket thay đổi, populate form và load images
    if (changes['ticket'] && this.ticket) {
      this.populateForm();
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
          this.existingImages = images;
          this.isLoadingImages = false;
          console.log('✅ Loaded existing images:', images);
        },
        error: (error) => {
          console.error('❌ Failed to load images:', error);
          this.isLoadingImages = false;
          // Không hiển thị toast error vì có thể ticket chưa có ảnh
          this.existingImages = [];
        },
      });
  }

  private populateForm(): void {
    if (this.ticket) {
      this.ticketForm.patchValue({
        title: this.ticket.title,
        description: this.ticket.description,
        type: this.ticket.type || null,
        note: this.ticket.note || '',
        assignedTo: this.ticket.processBy || null,
      });
    }
  }

  // Getter cho form controls để dễ truy cập trong template
  get title() {
    return this.ticketForm.get('title');
  }
  get description() {
    return this.ticketForm.get('description');
  }
  get type() {
    return this.ticketForm.get('type');
  }
  get note() {
    return this.ticketForm.get('note');
  }
  get assignedTo() {
    return this.ticketForm.get('assignedTo');
  }
  get isActive() {
    return this.ticketForm.get('isActive');
  }

  // Kiểm tra xem ticket có thể edit được không
  canEdit(): boolean {
    return this.ticket?.status === 0;
  }

  // Lấy error message cho title field
  getTitleErrorMessage(): string {
    if (this.title?.hasError('required')) {
      return 'Tiêu đề là bắt buộc';
    }
    if (this.title?.hasError('minlength')) {
      return 'Tiêu đề phải có ít nhất 1 ký tự';
    }
    if (this.title?.hasError('maxlength')) {
      return 'Tiêu đề không được vượt quá 200 ký tự';
    }
    return '';
  }

  // Lấy error message cho description field
  getDescriptionErrorMessage(): string {
    if (this.description?.hasError('required')) {
      return 'Mô tả là bắt buộc';
    }
    if (this.description?.hasError('minlength')) {
      return 'Mô tả phải có ít nhất 1 ký tự';
    }
    if (this.description?.hasError('maxlength')) {
      return 'Mô tả không được vượt quá 1000 ký tự';
    }
    return '';
  }

  // Lấy error message cho note field
  getNoteErrorMessage(): string {
    if (this.note?.hasError('maxlength')) {
      return 'Ghi chú không được vượt quá 255 ký tự';
    }
    return '';
  }

  onSubmit(): void {
    if (this.ticketForm.valid && !this.isSubmitting && this.canEdit() && this.ticket) {
      this.isSubmitting = true;
      const formData = this.ticketForm.value;
      const userId = this.getCurrentUserFromStorage()?.id || 1;

      // Chuẩn bị request body
      const requestBody = {
        title: formData.title,
        description: formData.description,
        type: formData.type || null,
        note: formData.note || null,
        slaType: 'B',
        isActive: true,
      };

      console.log('🔄 Updating ticket:', this.ticket.id, requestBody);

      // Bước 1: Update ticket
      this.ticketService
        .updateTicket(this.ticket.id, requestBody)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('✅ Ticket updated successfully:', response);

            // Bước 2: Upload ảnh mới nếu có
            if (this.selectedFiles.length > 0) {
              this.uploadMultipleImages(this.ticket!.id, userId);
            } else {
              this.toastService.showSuccess('✅ Cập nhật ticket thành công!');
              this.ticketUpdated.emit({
                ticketId: this.ticket!.id,
                updateData: formData,
              });
              this.isSubmitting = false;
            }
          },
          error: (error) => {
            console.error('❌ Failed to update ticket:', error);
            this.toastService.showError('Có lỗi xảy ra khi cập nhật ticket!');
            this.isSubmitting = false;
          },
        });
    } else {
      // Mark all fields as touched để hiển thị errors
      this.ticketForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.modalClosed.emit();
  }

  // Reset form khi modal được đóng
  resetForm(): void {
    this.ticketForm.reset();
    this.isSubmitting = false;
    this.clearAllImages();
    this.existingImages = [];
  }

  // ===== Multi-image upload methods =====

  // Tính tổng số ảnh (đã có + mới chọn)
  get totalImages(): number {
    return this.existingImages.length + this.selectedFiles.length;
  }

  // Kiểm tra có thể upload thêm ảnh không
  get canUploadMore(): boolean {
    return this.totalImages < this.maxImages;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const newFiles = Array.from(input.files);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    for (const file of newFiles) {
      // Kiểm tra số lượng ảnh tối đa (bao gồm cả ảnh đã có)
      if (this.totalImages >= this.maxImages) {
        this.toastService.showWarning(
          `Ticket này đã có ${this.existingImages.length} ảnh. Chỉ được upload tối đa ${this.maxImages} ảnh`
        );
        break;
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        this.toastService.showError(
          `File ${file.name} không phải là ảnh hợp lệ (JPEG, PNG, GIF, WebP)`
        );
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        this.toastService.showError(`File ${file.name} vượt quá kích thước tối đa 5MB`);
        continue;
      }

      // Thêm file vào danh sách
      this.selectedFiles.push(file);

      // Tạo preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imagePreviews.push({
          file: file,
          url: e.target?.result as string,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    }

    // Reset input để có thể chọn lại cùng file
    input.value = '';
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  clearAllImages(): void {
    this.selectedFiles = [];
    this.imagePreviews = [];
  }

  /**
   * Upload nhiều ảnh tuần tự cho ticket
   */
  private uploadMultipleImages(ticketId: number, userId: number): void {
    let uploadedCount = 0;
    let failedCount = 0;
    const totalFiles = this.selectedFiles.length;
    const uploadedFiles: any[] = [];

    const uploadNext = (index: number) => {
      if (index >= totalFiles) {
        this.handleUploadComplete(uploadedCount, failedCount, ticketId, uploadedFiles);
        return;
      }

      const file = this.selectedFiles[index];
      console.log(`🖼️  Uploading image ${index + 1}/${totalFiles}: ${file.name}`);

      this.ticketService
        .uploadImageToTicket(file, userId, ticketId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (uploadResponse) => {
            uploadedCount++;
            uploadedFiles.push(uploadResponse.uploadedFile);
            console.log(`✅ Upload ${index + 1}/${totalFiles} successful`);
            uploadNext(index + 1);
          },
          error: (uploadError) => {
            failedCount++;
            console.error(`❌ Upload ${index + 1}/${totalFiles} failed:`, uploadError);
            uploadNext(index + 1);
          },
        });
    };

    uploadNext(0);
  }

  /**
   * Xử lý khi hoàn thành upload tất cả ảnh
   */
  private handleUploadComplete(
    uploadedCount: number,
    failedCount: number,
    ticketId: number,
    uploadedFiles: any[]
  ): void {
    // Hiển thị toast notification phù hợp
    if (uploadedCount === this.selectedFiles.length) {
      this.toastService.showSuccess(
        `✅ Cập nhật ticket và upload ${uploadedCount} ảnh thành công!`
      );
    } else if (uploadedCount > 0) {
      this.toastService.showWarning(
        `⚠️ Ticket đã được cập nhật. Upload thành công ${uploadedCount}/${this.selectedFiles.length} ảnh.`
      );
    } else {
      this.toastService.showError('❌ Ticket đã được cập nhật nhưng tất cả ảnh upload thất bại');
    }

    // Emit event để parent component reload data
    this.ticketUpdated.emit({
      ticketId: ticketId,
      updateData: this.ticketForm.value,
      uploadedFiles: uploadedFiles,
    });

    this.isSubmitting = false;
  }

  private getCurrentUserFromStorage(): any | null {
    try {
      const raw = localStorage.getItem('current_user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // Helper methods cho status display
  getStatusLabel(status?: number): string {
    const statusLabels: { [key: number]: string } = {
      0: 'Mới tạo',
      1: 'Đang xử lý',
      2: 'Hoàn thành',
      3: 'Treo',
    };
    return statusLabels[status || 0] || 'Không xác định';
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
}
