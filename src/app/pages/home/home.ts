import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { FirebaseFCMService } from '../../services/firebase/firebase-fcm.service';
import {
  TicketService,
  Ticket,
  PaginatedResponse,
  TicketFilterRequest,
} from '../../services/ticket.service';
import { CreateTicketModalComponent } from '../../components/tickets/create-ticket-modal/create-ticket-modal.component';
import { EditTicketModalComponent } from '../../components/tickets/edit-ticket-modal/edit-ticket-modal.component';
import { ViewTicketModalComponent } from '../../components/tickets/view-ticket-modal/view-ticket-modal.component';
import { RateTicketModalComponent } from '../../components/tickets/rate-ticket-modal/rate-ticket-modal.component';
import { ToastComponent } from '../../components/toast/toast.component/toast.component';
import { ToastService } from '../../components/toast/toast.service';
import { environment } from '../../../environments/environment';

// Interface cho thống kê ticket
interface TicketStats {
  new: number;
  inProgress: number;
  completed: number;
  suspended: number;
}

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    CreateTicketModalComponent,
    EditTicketModalComponent,
    ViewTicketModalComponent,
    RateTicketModalComponent,
    ToastComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  currentUser: User | null = null;

  // Thống kê ticket
  ticketStats: TicketStats = {
    new: 0,
    inProgress: 0,
    completed: 0,
    suspended: 0,
  };

  // Danh sách ticket gần đây
  recentTickets: Ticket[] = [];
  isLoadingTickets = false;
  isLoadingStats = false;

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;

  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  showRateModal = false;
  selectedTicket: Ticket | null = null;
  selectedTicketForRating: Ticket | null = null;

  // Image preview modal states
  showImagePreviewModal = false;
  selectedTicketImages: any[] = [];
  currentImageIndex = 0;
  isLoadingImages = false;
  imgUrl = environment.imgUrl;
  ticketImageCounts = new Map<number, number>(); // Track số lượng ảnh của mỗi ticket

  // Math object để sử dụng trong template
  Math = Math;

  constructor(
    private authService: AuthService,
    private fcmService: FirebaseFCMService,
    private ticketService: TicketService,
    private toastService: ToastService
  ) {
    // Lấy currentUser từ localStorage ngay khi khởi tạo component
    this.loadCurrentUserFromLocalStorage();
  }

  ngOnInit(): void {
    // Subscribe để nhận update khi user thay đổi
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    // Load ticket data
    this.loadTicketStats();
    this.loadRecentTickets();

    // Initialize Firebase FCM for push notifications
    this.initializeFCM();
  }

  // Load currentUser từ localStorage
  private loadCurrentUserFromLocalStorage(): void {
    const userJson = localStorage.getItem('current_user');
    if (userJson) {
      try {
        this.currentUser = JSON.parse(userJson) as User;
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        this.currentUser = null;
      }
    }
  }

  // Load thống kê ticket từ API GetList với server-side filter
  loadTicketStats(): void {
    if (!this.currentUser?.id) {
      console.warn('No user ID available for loading ticket stats');
      return;
    }
    this.isLoadingStats = true;
    // API GetList hỗ trợ server-side filter theo createdBy, pageSize max = 100
    const filters = { createdBy: this.currentUser.id, isActive: true };
    this.ticketService.getTicketsList(1, 100, filters).subscribe({
      next: (resp) => {
        // resp.data chứa tickets của user (đã filter server-side)
        this.calculateTicketStats(resp.data || []);
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading ticket stats:', error);
        this.isLoadingStats = false;
        // Có thể hiển thị toast error ở đây
      },
    });
  }

  // Tính toán thống kê từ danh sách tickets
  private calculateTicketStats(tickets: Ticket[]): void {
    const stats = {
      new: 0,
      inProgress: 0,
      completed: 0,
      suspended: 0,
    };

    tickets.forEach((ticket) => {
      switch (ticket.status) {
        case 0: // Created/New
          stats.new++;
          break;
        case 1: // In Progress
          stats.inProgress++;
          break;
        case 2: // Completed
          stats.completed++;
          break;
        default:
          stats.suspended++;
          break;
      }
    });

    this.ticketStats = stats;
  }

  // Load danh sách ticket gần đây của user hiện tại với server-side pagination
  loadRecentTickets(): void {
    if (!this.currentUser?.id) {
      console.warn('No user ID available for loading recent tickets');
      return;
    }

    this.isLoadingTickets = true;

    // API GetList hỗ trợ server-side filter và pagination
    const filters = { createdBy: this.currentUser.id, isActive: true };
    this.ticketService.getTicketsList(this.currentPage, this.pageSize, filters).subscribe({
      next: (resp) => {
        // resp: PaginatedResponse<Ticket> - đã filter và paginate server-side
        this.recentTickets = resp.data || [];
        this.totalItems = resp.totalCount || 0;
        this.totalPages = resp.totalPages || 0;
        this.pageSize = resp.pageSize || this.pageSize;
        this.currentPage = resp.currentPage || this.currentPage;
        this.isLoadingTickets = false;

        // Load image counts cho các ticket
        this.loadTicketImageCounts();
      },
      error: (error) => {
        console.error('Error loading recent tickets:', error);
        this.isLoadingTickets = false;
        // Có thể hiển thị toast error ở đây
      },
    });
  }

  // Initialize Firebase Cloud Messaging
  private async initializeFCM(): Promise<void> {
    try {
      const userId = this.currentUser?.id?.toString();
      await this.fcmService.initialize(userId);
      console.log('Firebase FCM initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase FCM:', error);
    }
  }

  // Pagination methods
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRecentTickets();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRecentTickets();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRecentTickets();
    }
  }

  // Xử lý sự kiện chỉnh sửa ticket
  onEditTicket(ticket: Ticket): void {
    if (!this.canEditTicket(ticket)) {
      console.warn('Không được phép chỉnh sửa ticket này');
      return;
    }

    this.openEditModal(ticket);
  }

  // Xử lý sự kiện xem chi tiết ticket
  onViewTicket(ticket: Ticket): void {
    this.openViewModal(ticket);
  }

  // Xử lý sự kiện đánh giá ticket
  onRateTicket(ticket: Ticket): void {
    if (ticket.status !== 2) {
      console.warn('Chỉ được đánh giá ticket đã hoàn thành');
      return;
    }

    if (ticket.rate) {
      console.warn('Ticket đã được đánh giá rồi');
      return;
    }

    this.selectedTicketForRating = ticket;
    this.showRateModal = true;
  }

  // Method gọi API đánh giá ticket
  private rateTicket(ticketId: number, rate: number): void {
    this.ticketService.rateTicket(ticketId, rate).subscribe({
      next: (response) => {
        console.log('Đánh giá ticket thành công:', response);
        this.toastService.showSuccess('Đánh giá ticket thành công!');
        // Reload data để cập nhật
        this.loadRecentTickets();
      },
      error: (error) => {
        console.error('Lỗi khi đánh giá ticket:', error);
        this.toastService.showError('Có lỗi xảy ra khi đánh giá ticket. Vui lòng thử lại!');
      },
    });
  }

  // Xử lý sự kiện đánh giá từ modal
  onTicketRated(ratingData: { ticketId: number; rating: number }): void {
    this.rateTicket(ratingData.ticketId, ratingData.rating);
    this.closeRateModal();
  }

  // Đóng modal đánh giá
  closeRateModal(): void {
    this.showRateModal = false;
    this.selectedTicketForRating = null;
  }

  // Xử lý sự kiện tạo ticket mới
  onCreateTicket(): void {
    this.openCreateModal();
  }

  // Xử lý sự kiện cập nhật ticket
  onUpdateTicket(ticket: Ticket): void {
    if (!this.canEditTicket(ticket)) {
      console.warn('Không được phép cập nhật ticket này');
      return;
    }

    // TODO: Implement update logic - mở modal cập nhật hoặc navigate đến trang edit
    console.log('Cập nhật ticket:', ticket);
  }

  // Xử lý sự kiện thay đổi trạng thái ticket
  onChangeStatus(ticket: Ticket, newStatus: number): void {
    if (!this.currentUser?.id) {
      console.warn('Không có thông tin user để thay đổi trạng thái');
      return;
    }

    // TODO: Có thể thêm validation logic ở đây
    console.log('Thay đổi trạng thái ticket:', ticket.id, 'từ', ticket.status, 'thành', newStatus);

    this.changeTicketStatus(ticket.id, newStatus);
  }

  // Method gọi API thay đổi trạng thái ticket
  private changeTicketStatus(ticketId: number, status: number): void {
    this.ticketService.changeTicketStatus(ticketId, status).subscribe({
      next: (response: { message: string }) => {
        console.log('Thay đổi trạng thái ticket thành công:', response);
        this.toastService.showSuccess('Thay đổi trạng thái ticket thành công!');
        // Reload data để cập nhật
        this.loadRecentTickets();
        this.loadTicketStats();
      },
      error: (error: any) => {
        console.error('Lỗi khi thay đổi trạng thái ticket:', error);
        this.toastService.showError(
          'Có lỗi xảy ra khi thay đổi trạng thái ticket. Vui lòng thử lại!'
        );
      },
    });
  }

  // Xử lý sự kiện upload hình ảnh cho ticket
  onUploadImage(ticket: Ticket, file: File): void {
    if (!this.currentUser?.id) {
      console.warn('Không có thông tin user để upload hình ảnh');
      return;
    }

    console.log('Upload hình ảnh cho ticket:', ticket.id, file.name);
    this.uploadTicketImage(ticket.id, file, this.currentUser.id);
  }

  // Method gọi API upload hình ảnh
  private uploadTicketImage(ticketId: number, file: File, userId: number): void {
    this.ticketService.uploadImage(file, userId).subscribe({
      next: (response: any) => {
        console.log('Upload hình ảnh thành công:', response);
        this.toastService.showSuccess('Upload hình ảnh thành công!');
        // Có thể cập nhật ticket với đường dẫn hình ảnh mới
      },
      error: (error: any) => {
        console.error('Lỗi khi upload hình ảnh:', error);
        this.toastService.showError('Có lỗi xảy ra khi upload hình ảnh. Vui lòng thử lại!');
      },
    });
  }

  // Lấy chi tiết ticket theo ID
  getTicketById(ticketId: number): void {
    this.ticketService.getTicketById(ticketId).subscribe({
      next: (ticket: Ticket) => {
        console.log('Lấy chi tiết ticket thành công:', ticket);
        this.toastService.showSuccess('Lấy chi tiết ticket thành công!');
        // TODO: Có thể mở modal hiển thị chi tiết hoặc navigate đến trang detail
      },
      error: (error: any) => {
        console.error('Lỗi khi lấy chi tiết ticket:', error);
        this.toastService.showError('Có lỗi xảy ra khi lấy chi tiết ticket. Vui lòng thử lại!');
      },
    });
  }

  // Tạo ticket mới
  createNewTicket(ticketData: {
    title: string;
    description: string;
    status?: number;
    assignedTo?: number;
  }): void {
    if (!this.currentUser?.id) {
      console.warn('Không có thông tin user để tạo ticket');
      return;
    }

    const newTicket = {
      title: ticketData.title,
      description: ticketData.description,
      status: ticketData.status || 0,
      createdBy: this.currentUser.id,
      assignedTo: ticketData.assignedTo,
    };

    this.ticketService.createTicket(newTicket).subscribe({
      next: (response: { code: number; message: string }) => {
        console.log('Tạo ticket thành công:', response);
        // Toast đã được hiển thị trong modal component, không cần show lại ở đây
        // this.toastService.showSuccess('Tạo ticket thành công!');
        // Reload data để cập nhật danh sách
        this.loadRecentTickets();
        this.loadTicketStats();
        // Đóng modal và reset form
        this.closeCreateModal();
      },
      error: (error: any) => {
        console.error('Lỗi khi tạo ticket:', error);
        this.toastService.showError('Có lỗi xảy ra khi tạo ticket. Vui lòng thử lại!');
      },
    });
  }

  // Cập nhật thông tin ticket
  updateTicket(
    ticketId: number,
    updateData: { title?: string; description?: string; assignedTo?: number; rate?: number }
  ): void {
    this.ticketService.updateTicket(ticketId, updateData).subscribe({
      next: (response: { message: string }) => {
        console.log('Cập nhật ticket thành công:', response);
        this.toastService.showSuccess('Cập nhật ticket thành công!');
        // Reload data để cập nhật
        this.loadRecentTickets();
        this.loadTicketStats();
      },
      error: (error: any) => {
        console.error('Lỗi khi cập nhật ticket:', error);
        this.toastService.showError('Có lỗi xảy ra khi cập nhật ticket. Vui lòng thử lại!');
      },
    });
  }

  // Lấy danh sách số trang để hiển thị pagination
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5; // Hiển thị tối đa 5 số trang
    const startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Modal state
  // showCreateModal = false;
  // showEditModal = false;
  // showViewModal = false;
  // showRateModal = false;
  // selectedTicket: Ticket | null = null;
  // selectedTicketForRating: Ticket | null = null;

  // Modal event handlers
  openCreateModal(): void {
    this.showCreateModal = true;
    // Reset form khi mở modal
    // Note: Có thể cần thêm method resetForm trong CreateTicketModalComponent
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onTicketCreated(ticketData: any): void {
    console.log('Ticket data received from modal:', ticketData);
    // Modal đã tự xử lý việc tạo ticket và hiển thị toast
    // Chỉ cần reload data và đóng modal
    this.loadRecentTickets();
    this.loadTicketStats();
    this.closeCreateModal();
  }

  // Edit modal methods
  openEditModal(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedTicket = null;
  }

  onTicketUpdated(updateData: any): void {
    console.log('Ticket update data received:', updateData);
    // Modal đã tự xử lý việc update ticket và upload ảnh, hiển thị toast
    // Chỉ cần reload data và đóng modal
    this.loadRecentTickets();
    this.loadTicketStats();
    this.closeEditModal();
  }

  // View modal methods
  openViewModal(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedTicket = null;
  }

  onEditRequested(ticket: Ticket): void {
    this.closeViewModal();
    this.openEditModal(ticket);
  }

  onStatusChangeRequested(data: { ticket: Ticket; newStatus: number }): void {
    this.onChangeStatus(data.ticket, data.newStatus);
    // Optionally close modal or show confirmation
  }

  onRateRequested(ticket: Ticket): void {
    if (ticket.rate != null && ticket.rate !== undefined) {
      // toats warning
      this.toastService.showWarning('Ticket đã được đánh giá rồi');
      return;
    }
    this.onRateTicket(ticket);
    // Optionally close modal or show confirmation
  }

  // Helper methods để hiển thị trạng thái và loại ticket
  getStatusLabel(status: number): string {
    const statusLabels: { [key: number]: string } = {
      0: 'Mới tạo',
      1: 'Đang xử lý',
      2: 'Hoàn thành',
      3: 'Treo',
    };
    return statusLabels[status] || 'Không xác định';
  }

  getTypeLabel(type?: number): string {
    if (!type) return '';
    const typeLabels: { [key: number]: string } = {
      1: 'Phần cứng',
      2: 'Phần mềm',
      3: 'Mạng',
      4: 'Camera Chấm công',
      5: 'Máy in',
      6: 'PM văn phòng',
      7: 'PM thiết kế',
      8: 'Khác',
    };
    return typeLabels[type] || '';
  }

  getTypeClass(type?: number): string {
    if (!type) return 'bg-gray-100 text-gray-800';
    const typeClasses: { [key: number]: string } = {
      1: 'bg-red-100 text-red-800',        // Phần cứng - Đỏ
      2: 'bg-blue-100 text-blue-800',       // Phần mềm - Xanh dương
      3: 'bg-purple-100 text-purple-800',   // Mạng - Tím
      4: 'bg-green-100 text-green-800',     // Camera Chấm công - Xanh lá
      5: 'bg-yellow-100 text-yellow-800',   // Máy in - Vàng
      6: 'bg-pink-100 text-pink-800',       // PM văn phòng - Hồng
      7: 'bg-indigo-100 text-indigo-800',   // PM thiết kế - Chàm
      8: 'bg-gray-100 text-gray-800',       // Khác - Xám
    };
    return typeClasses[type] || 'bg-gray-100 text-gray-800';
  }

  getStatusClass(status: number): string {
    const statusClasses: { [key: number]: string } = {
      0: 'bg-gray-100 text-gray-800',
      1: 'bg-yellow-100 text-yellow-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-red-100 text-red-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  canEditTicket(ticket: Ticket): boolean {
    return ticket.status === 0;
  }

  // Image preview methods
  loadTicketImageCounts(): void {
    // Load số lượng ảnh cho mỗi ticket
    this.recentTickets.forEach((ticket) => {
      this.ticketService.getTicketImages(ticket.id).subscribe({
        next: (images) => {
          this.ticketImageCounts.set(ticket.id, images.length);
        },
        error: () => {
          this.ticketImageCounts.set(ticket.id, 0);
        },
      });
    });
  }

  hasImages(ticketId: number): boolean {
    return (this.ticketImageCounts.get(ticketId) || 0) > 0;
  }

  onPreviewImages(ticket: Ticket): void {
    this.isLoadingImages = true;
    this.ticketService.getTicketImages(ticket.id).subscribe({
      next: (images) => {
        if (images && images.length > 0) {
          this.selectedTicketImages = images;
          this.currentImageIndex = 0;
          this.showImagePreviewModal = true;
        } else {
          this.toastService.showWarning('Ticket này không có hình ảnh');
        }
        this.isLoadingImages = false;
      },
      error: (error) => {
        console.error('Lỗi khi tải hình ảnh:', error);
        this.toastService.showError('Không thể tải hình ảnh');
        this.isLoadingImages = false;
      },
    });
  }

  closeImagePreviewModal(): void {
    this.showImagePreviewModal = false;
    this.selectedTicketImages = [];
    this.currentImageIndex = 0;
  }

  nextImage(): void {
    if (this.currentImageIndex < this.selectedTicketImages.length - 1) {
      this.currentImageIndex++;
    }
  }

  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }
}
