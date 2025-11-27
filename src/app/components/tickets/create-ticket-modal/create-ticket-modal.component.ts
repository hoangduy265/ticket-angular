import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalComponent } from '../../modal.component/modal.component';
import { TicketService } from '../../../services/ticket.service';
import { ToastService } from '../../toast/toast.service';
import { switchMap, of, delay, catchError, tap, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-create-ticket-modal',
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './create-ticket-modal.component.html',
  styleUrl: './create-ticket-modal.component.css',
})
export class CreateTicketModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() ticketCreated = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  ticketForm: FormGroup;
  isSubmitting = false;

  // Multiple images support (max 3)
  selectedFiles: File[] = [];
  imagePreviews: { file: File; url: string; name: string }[] = [];
  maxImages = 3;

  // Subject để unsubscribe
  private destroy$ = new Subject<void>();

  // Options cho status dropdown
  statusOptions = [
    { value: 0, label: 'Mới tạo' },
    { value: 1, label: 'Đang xử lý' },
    { value: 2, label: 'Hoàn thành' },
    { value: 3, label: 'Treo' },
  ];

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
      status: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      type: [null, [Validators.required]],
      note: ['', [Validators.maxLength(255)]],
      assignedTo: [null],
      isActive: [true], // Mặc định là hoạt động
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset form khi modal được mở
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.resetForm();
    }
  }

  // Getter cho form controls để dễ truy cập trong template
  get title() {
    return this.ticketForm.get('title');
  }
  get description() {
    return this.ticketForm.get('description');
  }
  get status() {
    return this.ticketForm.get('status');
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

  // Lấy error message cho status field
  getStatusErrorMessage(): string {
    if (this.status?.hasError('required')) {
      return 'Trạng thái là bắt buộc';
    }
    if (this.status?.hasError('min') || this.status?.hasError('max')) {
      return 'Trạng thái không hợp lệ';
    }
    return '';
  }

  onSubmit(): void {
    // Prevent duplicate submission
    if (this.ticketForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = this.ticketForm.value;

      // Ensure createdBy is set from current user when available
      const currentUser = this.getCurrentUserFromStorage();
      const userId = currentUser?.id || 1; // fallback to 1 if not available
      (formData as any).createdBy = userId;

      // Create ticket first, then upload images if files exist using RxJS
      this.createTicketAndUploadImages(formData, userId);
    } else if (this.isSubmitting) {
      console.warn('⚠️ Form already submitting, ignoring duplicate submit');
    } else {
      // Mark all fields as touched để hiển thị errors
      this.ticketForm.markAllAsTouched();
    }
  }

  /**
   * Tạo ticket và upload hình ảnh theo thứ tự tuần tự
   */
  private createTicketAndUploadImages(formData: any, userId: number): void {
    // console.log('🚀 Starting createTicketAndUploadImages with:', {
    //   formData,
    //   userId,
    //   hasFiles: this.selectedFiles.length > 0,
    //   fileCount: this.selectedFiles.length,
    //   fileNames: this.selectedFiles.map((f) => f.name),
    // });

    // Chuẩn bị request body với các field cần thiết
    const requestBody = {
      title: formData.title,
      description: formData.description,
      status: 0, // Mặc định: Mới tạo
      type: formData.type || null,
      note: formData.note || null,
      createdBy: userId,
      slaType: 'A', // Mặc định: SLA Type A (1 giờ)
      isActive: true, // Mặc định: hoạt động
    };

    // console.log('📝 Request body:', requestBody);

    // Bước 1: Tạo ticket và nhận ID
    // console.log('📝 Step 1: Creating ticket...');
    this.ticketService
      .createTicketReturnId(requestBody)
      .pipe(
        delay(2000),
        tap((createResponse) => {
          // console.log('✅ Create ticket API response:', createResponse);
        }),
        catchError((createError) => {
          console.error('❌ Lỗi khi tạo ticket:', createError);
          this.toastService.showError('Có lỗi xảy ra khi tạo ticket. Vui lòng thử lại!');
          this.isSubmitting = false;
          throw createError;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (createResponse) => {
          let ticketId: number;
          if (typeof createResponse?.id === 'string') {
            ticketId = parseInt(createResponse.id, 10);
          } else if (typeof createResponse?.id === 'number') {
            ticketId = createResponse.id;
          } else {
            ticketId = 0;
          }

          if (!ticketId || isNaN(ticketId) || ticketId <= 0) {
            console.error('❌ Invalid ticket ID received:', ticketId);
            this.toastService.showError('Không nhận được ID ticket hợp lệ từ server');
            this.isSubmitting = false;
            return;
          }

          // console.log('✅ Ticket created successfully with ID:', ticketId);

          // Bước 2: Upload nhiều ảnh (nếu có)
          if (this.selectedFiles.length > 0) {
            this.uploadMultipleImages(ticketId, userId, formData);
          } else {
            // Hiển thị toast thành công
            this.toastService.showSuccess('✅ Tạo ticket thành công!');
            // Emit event để parent component reload data
            this.ticketCreated.emit({ id: ticketId, ...formData });
            // Reset form và đóng modal
            this.resetForm();
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('❌ Unexpected error:', error);
        },
      });
  }

  /**
   * Upload nhiều ảnh tuần tự cho ticket
   */
  private uploadMultipleImages(ticketId: number, userId: number, formData: any): void {
    let uploadedCount = 0;
    let failedCount = 0;
    const totalFiles = this.selectedFiles.length;
    const uploadedFiles: any[] = [];

    const uploadNext = (index: number) => {
      if (index >= totalFiles) {
        this.handleUploadComplete(uploadedCount, failedCount, ticketId, formData, uploadedFiles);
        return;
      }

      const file = this.selectedFiles[index];
      // console.log(
      //   `🖼️  Uploading image ${index + 1}/${totalFiles}: ${file.name}, size: ${file.size}`
      // );

      this.ticketService
        .uploadImageToTicket(file, userId, ticketId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (uploadResponse) => {
            uploadedCount++;
            uploadedFiles.push(uploadResponse.uploadedFile);
            // console.log(`✅ Upload ${index + 1}/${totalFiles} successful, file: ${file.name}`);
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
    formData: any,
    uploadedFiles: any[]
  ): void {
    // Hiển thị toast notification phù hợp
    if (uploadedCount === this.selectedFiles.length) {
      this.toastService.showSuccess(`✅ Tạo ticket và upload ${uploadedCount} ảnh thành công!`);
    } else if (uploadedCount > 0) {
      this.toastService.showWarning(
        `⚠️ Ticket đã được tạo. Upload thành công ${uploadedCount}/${this.selectedFiles.length} ảnh.`
      );
    } else {
      this.toastService.showError('❌ Ticket đã được tạo nhưng tất cả ảnh upload thất bại');
    }

    // Emit event để parent component reload data
    this.ticketCreated.emit({
      id: ticketId,
      ...formData,
      uploadedFiles: uploadedFiles,
    });

    // Reset form và đóng modal
    this.resetForm();
    this.isSubmitting = false;
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;

    if (files && files.length > 0) {
      const remainingSlots = this.maxImages - this.selectedFiles.length;
      const filesToAdd = Math.min(files.length, remainingSlots);

      if (files.length > remainingSlots) {
        this.toastService.showWarning(
          `Chỉ có thể thêm ${remainingSlots} ảnh nữa. Tối đa ${this.maxImages} ảnh.`
        );
      }

      for (let i = 0; i < filesToAdd; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          this.toastService.showError(`File "${file.name}" không phải là hình ảnh!`);
          continue;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          this.toastService.showError(`File "${file.name}" vượt quá 5MB!`);
          continue;
        }

        this.selectedFiles.push(file);

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push({
            file: file,
            url: e.target.result,
            name: file.name,
          });
        };
        reader.readAsDataURL(file);
      }

      event.target.value = '';
    }
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  clearAllImages(): void {
    this.selectedFiles = [];
    this.imagePreviews = [];
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

  onCancel(): void {
    this.modalClosed.emit();
  }

  resetForm(): void {
    this.ticketForm.reset({
      title: '',
      description: '',
      status: 0,
      type: null,
      note: '',
      assignedTo: null,
      isActive: true,
    });
    this.clearAllImages();
    this.isSubmitting = false;

    const fileInput = document.getElementById('attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Chụp ảnh từ camera trên thiết bị mobile
   */
  takePicture(): void {
    // Kiểm tra đã đạt giới hạn ảnh chưa
    if (this.selectedFiles.length >= this.maxImages) {
      this.toastService.showWarning(`Đã đạt giới hạn ${this.maxImages} ảnh!`);
      return;
    }

    // Tạo input element ẩn để trigger camera
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Sử dụng camera sau (environment) hoặc 'user' cho camera trước

    input.onchange = (event: any) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      // Kiểm tra file type
      if (!file.type.startsWith('image/')) {
        this.toastService.showError('File không phải là hình ảnh!');
        return;
      }

      // Kiểm tra file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.toastService.showError('Ảnh vượt quá 5MB!');
        return;
      }

      // Thêm file vào danh sách
      this.selectedFiles.push(file);

      // Tạo preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push({
          file: file,
          url: e.target.result,
          name: file.name || 'Camera-' + new Date().getTime() + '.jpg',
        });
      };
      reader.readAsDataURL(file);

      this.toastService.showSuccess('✅ Đã thêm ảnh!');
    };

    // Trigger click để mở camera
    input.click();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
