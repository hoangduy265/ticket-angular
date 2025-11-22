import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// NoticeBoard Model
export interface NoticeBoard {
  id: number;
  title: string;
  description: string;
  content: string;
  type: number;
  priority: number;
  startDate: string;
  endDate: string;
  targetAudience: number;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt?: string;
  imageUrl?: string;
}

// API Response interfaces
export interface NoticeBoardResponse {
  success: boolean;
  message: string;
  data: NoticeBoard;
}

export interface NoticeBoardListResponse {
  success: boolean;
  message: string;
  data: NoticeBoard[];
  count: number;
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  timestamp: string;
  service: string;
  version: string;
  stats: {
    totalNoticeBoards: number;
    activeNoticeBoards: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NoticeBoardService {
  private readonly API_URL = environment.apiUrl + '/NoticeBoard';

  constructor(private http: HttpClient) {}

  /**
   * Lấy NoticeBoard theo ID
   */
  getNoticeBoardById(id: number): Observable<NoticeBoardResponse> {
    return this.http.get<NoticeBoardResponse>(`${this.API_URL}/${id}`);
  }

  /**
   * Lấy danh sách NoticeBoard active cho Web (5 record mới nhất)
   */
  getWebNoticeBoards(): Observable<NoticeBoardListResponse> {
    return this.http.get<NoticeBoardListResponse>(`${this.API_URL}/web`);
  }

  /**
   * Lấy NoticeBoard gần đây (1 cái gần nhất)
   */
  getRecentNoticeBoards(count: number = 1): Observable<NoticeBoardListResponse> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<NoticeBoardListResponse>(`${this.API_URL}/recent`, { params });
  }

  /**
   * Health check
   */
  healthCheck(): Observable<HealthCheckResponse> {
    return this.http.get<HealthCheckResponse>(`${this.API_URL}/health`);
  }

  /**
   * Helper methods cho UI
   */
  getTypeLabel(type: number): string {
    const typeLabels: { [key: number]: string } = {
      1: 'Thông báo chung',
      2: 'Thông báo khẩn cấp',
      3: 'Thông báo sự kiện',
    };
    return typeLabels[type] || 'Không xác định';
  }

  getPriorityLabel(priority: number): string {
    const priorityLabels: { [key: number]: string } = {
      1: 'Thấp',
      2: 'Trung bình',
      3: 'Cao',
    };
    return priorityLabels[priority] || 'Không xác định';
  }

  getTypeClass(type: number): string {
    const typeClasses: { [key: number]: string } = {
      1: 'bg-blue-100 text-blue-800', // Thông báo chung - Xanh dương
      2: 'bg-red-100 text-red-800', // Thông báo khẩn cấp - Đỏ
      3: 'bg-green-100 text-green-800', // Thông báo sự kiện - Xanh lá
    };
    return typeClasses[type] || 'bg-gray-100 text-gray-800';
  }

  getPriorityClass(priority: number): string {
    const priorityClasses: { [key: number]: string } = {
      1: 'bg-gray-100 text-gray-800', // Thấp - Xám
      2: 'bg-yellow-100 text-yellow-800', // Trung bình - Vàng
      3: 'bg-red-100 text-red-800', // Cao - Đỏ
    };
    return priorityClasses[priority] || 'bg-gray-100 text-gray-800';
  }
}
