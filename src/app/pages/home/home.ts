import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';

// Interface cho Ticket
interface Ticket {
  id: string;
  title: string;
  category: string;
  status: 'new' | 'processing' | 'completed' | 'suspended';
  createdBy: string;
  createdAt: Date;
}

// Interface cho thống kê ticket
interface TicketStats {
  new: number;
  inProgress: number;
  completed: number;
  suspended: number;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  currentUser: User | null = null;

  // Thống kê ticket
  ticketStats: TicketStats = {
    new: 25,
    inProgress: 18,
    completed: 42,
    suspended: 5,
  };

  // Danh sách ticket gần đây
  recentTickets: Ticket[] = [
    {
      id: 'TK001',
      title: 'Lỗi đăng nhập hệ thống',
      category: 'Kỹ thuật',
      status: 'new',
      createdBy: 'Nguyễn Văn A',
      createdAt: new Date('2024-12-19T10:30:00'),
    },
    {
      id: 'TK002',
      title: 'Yêu cầu cấp tài khoản mới',
      category: 'Hành chính',
      status: 'processing',
      createdBy: 'Trần Thị B',
      createdAt: new Date('2024-12-19T09:15:00'),
    },
    {
      id: 'TK003',
      title: 'Báo cáo lỗi in ấn',
      category: 'Kỹ thuật',
      status: 'completed',
      createdBy: 'Lê Văn C',
      createdAt: new Date('2024-12-19T08:45:00'),
    },
    {
      id: 'TK004',
      title: 'Hỗ trợ cài đặt phần mềm',
      category: 'Hỗ trợ',
      status: 'suspended',
      createdBy: 'Phạm Thị D',
      createdAt: new Date('2024-12-18T16:20:00'),
    },
    {
      id: 'TK005',
      title: 'Thay đổi thông tin cá nhân',
      category: 'Hành chính',
      status: 'new',
      createdBy: 'Hoàng Văn E',
      createdAt: new Date('2024-12-18T14:10:00'),
    },
  ];

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 50; // Giả sử có 50 ticket tổng cộng
  totalPages: number = Math.ceil(this.totalItems / this.pageSize);

  // Math object để sử dụng trong template
  Math = Math;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    // Load ticket data
    this.loadTicketStats();
    this.loadRecentTickets();
  }

  // Load thống kê ticket
  loadTicketStats(): void {
    // Trong thực tế, sẽ gọi API để lấy thống kê
    // this.ticketService.getTicketStats().subscribe(stats => {
    //   this.ticketStats = stats;
    // });
  }

  // Load danh sách ticket gần đây
  loadRecentTickets(): void {
    // Trong thực tế, sẽ gọi API để lấy danh sách ticket
    // this.ticketService.getRecentTickets(this.currentPage, this.pageSize).subscribe(tickets => {
    //   this.recentTickets = tickets.data;
    //   this.totalItems = tickets.total;
    //   this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    // });
  }

  // Lấy label của trạng thái ticket
  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      new: 'Mới tạo',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      suspended: 'Treo',
    };
    return statusLabels[status] || status;
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
}
