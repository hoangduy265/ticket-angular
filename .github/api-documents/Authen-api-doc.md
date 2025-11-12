# Tài liệu API Xác thực Người dùng (Authentication)

Tài liệu mô tả các API cho hệ thống xác thực người dùng với JWT Token và Refresh Token.

## Base URL

```text
/api/authen
```

---

## 1. Đăng nhập (Login)

### 1.1 Đăng nhập người dùng

**POST** `/api/authen/login`

**Request Body:**

```json
{
  "username": "john_doe",         // string - Required - Tên đăng nhập
  "password": "password123"       // string - Required - Mật khẩu
}
```

**Response Success (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "username": "john_doe",
    "email": "john_doe@gmail.com",
    "avatarUrl": "https://example.com/avatar.jpg",
    "personalEmail": "john@personal.com",
    "workEmail": "john@company.com",
    "address": "123 Main St",
    "phone": "0123456789",
    "state": true,
    "deptId": 1,
    "departmentName": "IT Department",
    "companyId": 1,
    "companyName": "Royal Company",
    "note": "Additional notes"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires": "2024-12-13T18:00:00Z",
  "refresh_token": "abc123def456ghi789...",
  "refresh_token_expires": "2024-12-20T10:00:00Z"
}
```

**Response Error (400):**

```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": [
    "Username is required",
    "Password is required"
  ]
}
```

**Response Error (401):**

```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

**Response Error (500):**

```json
{
  "success": false,
  "message": "An error occurred during login",
  "error": "Internal server error details"
}
```

---

## 2. Làm mới Token (Refresh Token)

### 2.1 Làm mới Access Token

**POST** `/api/authen/refreshtoken`

**Request Body:**

```json
{
  "refreshToken": "abc123def456ghi789..."  // string - Required - Refresh token
}
```

**Response Success (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires": "2024-12-13T18:00:00Z",
  "refresh_token": "new_refresh_token_here...",
  "refresh_token_expires": "2024-12-20T10:00:00Z"
}
```

**Response Error (400):**

```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": [
    "Refresh token is required"
  ]
}
```

**Response Error (401):**

```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

**Response Error (500):**

```json
{
  "success": false,
  "message": "An error occurred while refreshing token",
  "error": "Internal server error details"
}
```

---

## 3. Đăng xuất (Logout)

### 3.1 Đăng xuất người dùng

**POST** `/api/authen/logout`

**Headers:**

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body (Optional):**

```json
{
  "refreshToken": "abc123def456ghi789..."  // string - Optional - Refresh token để logout từ thiết bị cụ thể
}
```

**Response Success (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

hoặc khi logout từ tất cả thiết bị:

```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

**Response Error (400):**

```json
{
  "success": false,
  "message": "User ID or refresh token is required"
}
```

**Response Error (401):**

```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

**Response Error (500):**

```json
{
  "success": false,
  "message": "An error occurred during logout",
  "error": "Internal server error details"
}
```

---

## 4. Thông tin Người dùng Hiện tại

### 4.1 Lấy thông tin user đang đăng nhập

**GET** `/api/authen/me`

**Headers:**

```text
Authorization: Bearer <access_token>
```

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "username": "john_doe",
    "name": "John Doe",
    "email": "john@personal.com"
  }
}
```

**Response Error (401):**

```json
{
  "success": false,
  "message": "Invalid token"
}
```

**Response Error (500):**

```json
{
  "success": false,
  "message": "An error occurred while retrieving user info"
}
```

---

## 5. Google Sheets Authentication (Optional)

### 5.1 Đăng nhập qua Google Sheets

**POST** `/api/google/ggslogin`

**Query Parameters:**

- `username` (string): Tên đăng nhập
- `password` (string): Mật khẩu

**Response Success (200):**

```json
{
  "username": "john_doe",
  "fullname": "John Doe",
  "phone": "0123456789",
  "email": "john@example.com",
  "departmentId": 1,
  "status": true,
  "createdAt": "2024-12-13T10:00:00Z"
}
```

**Response Error (400):**

```json
{
  "message": "Username and password cannot be empty."
}
```

**Response Error (404):**

```json
{
  "message": "User not found in Google Sheet."
}
```

**Response Error (500):**

```json
{
  "message": "An error occurred while logging in to Google Sheet.",
  "error": "Error details"
}
```

---

### Ghi chú

- **Framework**: API sử dụng ASP.NET Core Identity cho authentication và authorization
- **Database**: User data được lưu trong bảng `sys_user` với mapping Identity properties
- **Token Expiration**: Access token có thời hạn 1 giờ, refresh token có thời hạn 7 ngày
- **Concurrent Sessions**: Hệ thống chỉ cho phép một refresh token active tại một thời điểm
- **Logout Options**: Có thể logout từ thiết bị hiện tại hoặc tất cả thiết bị

### Authentication Flow

1. **Login**: Gửi username/password để nhận access token và refresh token
2. **API Calls**: Sử dụng access token trong header `Authorization: Bearer <token>`
3. **Token Refresh**: Khi access token hết hạn, sử dụng refresh token để lấy token mới
4. **User Info**: Sử dụng access token để lấy thông tin user hiện tại
5. **Logout**: Thu hồi refresh token và đăng xuất (từ thiết bị hiện tại hoặc tất cả thiết bị)
6. **Protected Routes**: Các API có `[Authorize]` yêu cầu access token hợp lệ

### Token Information

- **Access Token**: JWT token có thời gian sống ngắn (thường 15-60 phút)
- **Refresh Token**: Token có thời gian sống dài (thường 7 ngày) để làm mới access token
- **Token Type**: Luôn là "Bearer"

### Security Features

- **ASP.NET Identity**: Sử dụng ASP.NET Core Identity framework cho quản lý user và authentication
- **Password Hashing**: Mật khẩu được hash bằng BCrypt
- **JWT Bearer Authentication**: Token-based authentication với JWT
- **Refresh Token Rotation**: Mỗi lần refresh sẽ tạo refresh token mới
- **Token Revocation**: Hỗ trợ thu hồi refresh token khi logout
- **Single Session**: Mỗi user chỉ có một refresh token active tại một thời điểm

### Headers Required

**For Protected APIs:**

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Error Codes

- **400**: Bad Request - Dữ liệu đầu vào không hợp lệ
- **401**: Unauthorized - Token không hợp lệ hoặc hết hạn
- **403**: Forbidden - Không có quyền truy cập
- **404**: Not Found - Không tìm thấy user
- **500**: Internal Server Error - Lỗi hệ thống

### JWT Token Claims

Access token chứa các thông tin sau:

- **NameIdentifier**: User ID
- **Name**: Username
- **Name** (custom): Full name
- **PersonalEmail**: Email cá nhân
- **WorkEmail**: Email công việc
- **Address**: Địa chỉ
- **Phone**: Số điện thoại
- **State**: Trạng thái user (true/false)
- **CompanyId**: ID công ty
- **CompanyName**: Tên công ty
- **DepartmentId**: ID phòng ban
- **DepartmentName**: Tên phòng ban
- **Expiry**: Thời gian hết hạn

### Best Practices

- **Token Storage**: Lưu access token trong memory, refresh token trong secure storage
- **Error Handling**: Luôn kiểm tra response status và xử lý lỗi phù hợp
- **Token Refresh**: Tự động refresh token khi nhận 401 Unauthorized
- **Logout**: Gọi logout endpoint khi user đăng xuất để thu hồi refresh token
- **Session Management**: Xử lý trường hợp logout từ nhiều thiết bị
