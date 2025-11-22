import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NoticeBoardService, NoticeBoard } from '../../services/NoticeBoard.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-news',
  imports: [CommonModule],
  templateUrl: './news.html',
  styleUrl: './news.css',
})
export class News implements OnInit {
  latestNews: NoticeBoard | null = null;
  recentNews: NoticeBoard[] = [];
  selectedNews: NoticeBoard | null = null;
  isLoading = true;
  error: string | null = null;
  imageUrl: string = environment.imgUrl;

  constructor(private noticeBoardService: NoticeBoardService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadNews();
  }

  private loadNews(): void {
    this.isLoading = true;
    this.error = null;

    // Load latest news (1 item)
    this.noticeBoardService.getWebNoticeBoards().subscribe({
      next: (response) => {
        if (response.success && response.data.length > 0) {
          this.latestNews = response.data.slice(0, 1)[0];
        }
      },
      error: (err) => {
        console.error('Error loading latest news:', err);
        this.error = 'Không thể tải tin tức mới nhất';
      },
    });

    // Load recent news (5 items)
    this.noticeBoardService.getWebNoticeBoards().subscribe({
      next: (response) => {
        if (response.success) {
          this.recentNews = response.data.slice(1, 5); // Take only 5 items
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading recent news:', err);
        this.error = 'Không thể tải danh sách tin tức';
        this.isLoading = false;
      },
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getTypeLabel(type: number): string {
    return this.noticeBoardService.getTypeLabel(type);
  }

  getPriorityLabel(priority: number): string {
    return this.noticeBoardService.getPriorityLabel(priority);
  }

  getTypeClass(type: number): string {
    return this.noticeBoardService.getTypeClass(type);
  }

  getPriorityClass(priority: number): string {
    return this.noticeBoardService.getPriorityClass(priority);
  }

  onImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
  }

  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  viewNews(news: NoticeBoard): void {
    this.selectedNews = news;
  }

  backToLatest(): void {
    this.selectedNews = null;
  }
}
