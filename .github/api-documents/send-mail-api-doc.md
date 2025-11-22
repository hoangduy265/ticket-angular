### 1. Gửi Email

**POST** `/api/NotifySend/SendEmail`

**Mô tả**: Gửi email thông báo đến người dùng.

**Parameters**: Không có

**Request Body**:

```json
{
  "toEmail": "string (required, email format)",
  "subject": "string (required, max 200 chars)",
  "message": "string (required, max 5000 chars)",
  "isHtml": "boolean (optional, default: true)"
}
```

**Example Request** (HTML Email):

```json
{
  "toEmail": "user@example.com",
  "subject": "Thông báo mới từ hệ thống",
  "message": "<html><body><h1>Xin chào!</h1><p>Bạn có một <strong>ticket mới</strong> cần xử lý.</p></body></html>",
  "isHtml": true
}
```

**Example Request** (Plain Text Email):

```json
{
  "toEmail": "user@example.com",
  "subject": "Thông báo đơn giản",
  "message": "Bạn có một ticket mới cần xử lý.",
  "isHtml": false
}
```

**Response Body** (Success):

```json
{
  "success": true,
  "message": "Email đã được gửi thành công"
}
```

**Response Body** (Error):

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    "To field is required",
    "Subject field is required"
  ]
}
```

**Status Codes**:

- `200`: Gửi email thành công
- `400`: Dữ liệu đầu vào không hợp lệ
- `500`: Lỗi hệ thống khi gửi email

---
