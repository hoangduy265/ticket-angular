import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SendMailService } from '../../services/send-mail.service';

interface ContactForm {
  subject: string;
  message: string;
}

interface UserInfo {
  id: number;
  name: string;
  email: string;
  phone?: string;
  departmentName?: string;
  companyName?: string;
}

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact implements OnInit {
  contactForm: ContactForm = {
    subject: '',
    message: '',
  };

  currentUser: UserInfo | null = null;
  isSubmitting = false;
  submitSuccess = false;
  submitError: string | null = null;

  constructor(private sendMailService: SendMailService) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    try {
      const userJson = localStorage.getItem('current_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        this.currentUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          departmentName: user.departmentName,
          companyName: user.companyName,
        };
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  onSubmit(): void {
    // Reset states
    this.submitSuccess = false;
    this.submitError = null;

    // Basic validation
    if (!this.contactForm.subject.trim()) {
      this.submitError = 'Vui lòng chọn chủ đề';
      return;
    }

    if (!this.contactForm.message.trim()) {
      this.submitError = 'Vui lòng nhập nội dung tin nhắn';
      return;
    }

    if (this.contactForm.message.trim().length < 10) {
      this.submitError = 'Nội dung tin nhắn phải có ít nhất 10 ký tự';
      return;
    }

    this.isSubmitting = true;

    this.sendMailService
      .sendContactEmail(this.contactForm.subject, this.contactForm.message)
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.submitSuccess = true;
            // Reset form
            this.contactForm = {
              subject: '',
              message: '',
            };
          } else {
            this.submitError = response.message || 'Có lỗi xảy ra khi gửi email';
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.submitError = error.message || 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.';
          console.error('Contact form submission error:', error);
        },
      });
  }

  // Helper method to check if form is valid
  isFormValid(): boolean {
    return !!(this.contactForm.subject.trim() && this.contactForm.message.trim().length >= 10);
  }

  // Reset success message when user starts typing
  onInputChange(): void {
    if (this.submitSuccess) {
      this.submitSuccess = false;
    }
    if (this.submitError) {
      this.submitError = null;
    }
  }
}
