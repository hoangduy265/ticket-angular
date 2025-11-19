# Hướng dẫn Copilot cho Ứng dụng Ticket Angular

## Tổng quan Dự án

Đây là ứng dụng quản lý ticket của người dùng dựa trên Angular được xây dựng với Angular 20.3.0. Ứng dụng cung cấp giao diện web để quản lý ticket, với xác thực, vai trò người dùng và các chức năng liên quan đến ticket khác nhau.

## Ngăn xếp Công nghệ

- **Framework**: Angular 20.3.0
- **Ngôn ngữ**: TypeScript 5.9.2
- **Framework UI**: Mẫu AdminLTE
- **Công cụ Build**: Angular CLI 20.3.9
- **Kiểm thử**: Jasmine, Karma
- **Quản lý Gói**: npm

## UI/UX

- Giao diện người dùng được xây dựng dựa trên tailwindcss, cung cấp thiết kế responsive và các thành phần UI sẵn có.
- Sử dụng các modal component để hiển thị chi tiết, chỉnh sửa và tạo mới ticket.
- hạn chế viết CSS tùy chỉnh, tận dụng tối đa các lớp tiện ích của tailwindcss để duy trì tính nhất quán và dễ bảo trì.

## Cấu trúc Thư mục

```
ticket-angular/
├── .angular/                 # Bộ nhớ cache build Angular
├── .github/                  # Cấu hình GitHub và hướng dẫn Copilot
|   ├── api-documents/        # Tài liệu API cho Copilot tham khảo khi tạo mã
|   ├── features-instructions/        # Mô tả và hướng dẫn cho Copilot xây dựng các tính năng riêng.
|   └── copilot-instructions.md        # File hướng dẫn Copilot cho toàn bộ dự án
├── .vscode/                  # Cài đặt workspace VS Code
├── node_modules/             # Các dependencies
├── public/                   # Tài sản tĩnh
├── src/                      # Mã nguồn
│   ├── app/                  # Mã ứng dụng chính
│   │   ├── components/       # Các component UI có thể tái sử dụng
│   │   │   ├── modal.component/
│   │   │   └── toast.component/
│   │   ├── guards/           # Guards route cho xác thực
│   │   │   ├── auth.guard.ts
│   │   │   └── login.guard.ts
│   │   ├── interceptors/     # HTTP interceptors
│   │   │   └── auth.interceptor.ts
│   │   ├── interfaces/       # Interfaces TypeScript
│   │   ├── layout/           # Các component bố cục
│   │   │   ├── footer/
│   │   │   ├── header/
│   │   │   ├── left-sidebar/
│   │   │   └── main-page-lout/
│   │   ├── pages/            # Các component trang
│   │   │   ├── home/
│   │   │   └── login/
│   │   ├── services/         # Các services Angular
│   │   │   ├── auth.service.ts
│   │   │   └── ticket.service.ts
│   │   ├── app.config.ts     # Cấu hình ứng dụng
│   │   ├── app.routes.ts     # Cấu hình routing
│   │   ├── app.ts            # Component app chính
│   │   └── app.html          # Template app
│   ├── assets/               # Tài sản ứng dụng
│   ├── environments/         # Cấu hình môi trường
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html            # File HTML chính
│   ├── main.ts               # Bootstrap ứng dụng
│   └── styles.css            # Styles toàn cục
├── templates/                # Tài sản mẫu (tailwindcss)
├── angular.json              # Cấu hình Angular CLI
├── package.json              # Dependencies và scripts
├── tsconfig.json             # Cấu hình TypeScript
└── README.md                 # Tài liệu dự án
```

## Các Thành phần Chính

### Các Thành phần Cốt lõi

- **App Component**: Thành phần ứng dụng chính
- **Modal Component**: Hộp thoại modal có thể tái sử dụng
- **Toast Component**: Hệ thống thông báo

### Các Thành phần Bố cục

- **Header**: Tiêu đề ứng dụng với điều hướng
- **Footer**: Chân trang ứng dụng
- **Left Sidebar**: Thanh bên điều hướng
- **Main Page Layout**: Bao bọc bố cục nội dung chính

### Các Thành phần Trang

- **Home**: Trang chủ/bảng điều khiển
- **Login**: Trang xác thực người dùng

## Dịch vụ

### Dịch vụ Xác thực

Xử lý đăng nhập, đăng xuất, quản lý token và trạng thái xác thực của người dùng.

### Dịch vụ Ticket

Quản lý các thao tác liên quan đến ticket (thao tác CRUD cho ticket) của user.
Chỉ tải những ticket liên quan đến user đã đăng nhập.
Chỉ được chỉnh sửa khi ticket có trạng thái là mới tạo (status = 0).

## Guards và Interceptors

### Auth Guard

Bảo vệ các route yêu cầu xác thực.

### Login Guard

Ngăn người dùng đã xác thực truy cập trang đăng nhập.

### Auth Interceptor

Tự động thêm token xác thực vào các yêu cầu HTTP.

## Hướng dẫn Phát triển

### Quy tắc phản hồi chat

- Luôn phản hồi bằng Tiếng Việt cho các câu hỏi liên quan đến dự án này.

### Phong cách Mã

- Sử dụng TypeScript cho tất cả mã mới
- Tuân theo hướng dẫn phong cách Angular
- Sử dụng dấu ngoặc đơn cho chuỗi
- Độ rộng dòng tối đa: 100 ký tự

### Quy ước Đặt tên

- Components: PascalCase (ví dụ: `ModalComponent`)
- Services: PascalCase với hậu tố 'Service' (ví dụ: `AuthService`)
- Files: kebab-case (ví dụ: `auth.service.ts`)

### Xây dựng và Triển khai

- Máy chủ phát triển: `npm start` (chạy trên port 4300)
- Build sản xuất: `npm run build`
- Các artifact build được lưu trong thư mục `dist/`

## Cấu hình Môi trường

- Phát triển: `environments/environment.ts`
- Sản xuất: `environments/environment.prod.ts`

## Tài sản và Mẫu

- Tài sản tĩnh trong `src/assets/`
- Các file mẫu AdminLTE trong `templates/adminlte/`

## Đóng góp

1. Tuân theo phong cách mã và quy ước đã thiết lập
2. Viết tests cho các tính năng mới
3. Cập nhật tài liệu khi cần
4. Đảm bảo build pass trước khi commit

## Ghi chú Bổ sung

- Ứng dụng sử dụng AdminLTE cho styling UI
- Xác thực được xử lý thông qua guards và interceptors
- Tất cả yêu cầu HTTP được chặn để xác thực
- Ứng dụng hỗ trợ thiết kế responsive thông qua AdminLTE

## Bảo mật

### Bảo mật Firebase trong ứng dụng Angular

#### 1. **Firebase Config Security**

##### ✅ Những gì AN TOÀN để public:

- `apiKey`: Firebase API key (được thiết kế để public)
- `authDomain`: Authentication domain
- `projectId`: Firebase project ID
- `messagingSenderId`: FCM sender ID
- `appId`: Firebase app ID

##### ❌ Những gì KHÔNG được expose:

- `serviceAccountKey.json`: Chứa private keys
- Database secrets
- Storage secrets
- Server-side API keys

#### 2. **Vấn đề hiện tại**

## Quy tắc chạy terminal từ chat

Khi chạy lệnh terminal được đề xuất từ chat, hãy tuân theo các quy tắc sau:

- Chỉ chạy lệnh trong môi trường phát triển cục bộ. không cần cd vào thư mục dự án.
