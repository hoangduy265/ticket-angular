# Notification API Documentation

## Tổng quan

API gửi thông báo qua Email, Telegram và Firebase Cloud Messaging (FCM) trong hệ thống RoyalAPI.

## Endpoints

### 1. Gửi Email

**POST** `/api/NotifySend/SendEmail`

**Mô tả**: Gửi email thông báo đến người dùng.

**Parameters**: Không có

**Request Body**:

```json
{
  "to": "string (required, email format)",
  "subject": "string (required)",
  "body": "string (required)",
  "isHtml": "boolean (optional, default: false)"
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

### 2. Gửi Telegram

**POST** `/api/NotifySend/SendTelegram`

**Mô tả**: Gửi tin nhắn thông báo qua Telegram.

**Parameters**: Không có

**Request Body**:

```json
{
  "chatId": "string (required)",
  "message": "string (required)",
  "parseMode": "string (optional, values: 'HTML', 'Markdown')"
}
```

**Response Body** (Success):

```json
{
  "success": true,
  "message": "Tin nhắn Telegram đã được gửi thành công"
}
```

**Response Body** (Error):

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    "ChatId field is required",
    "Message field is required"
  ]
}
```

**Status Codes**:

- `200`: Gửi tin nhắn Telegram thành công
- `400`: Dữ liệu đầu vào không hợp lệ
- `500`: Lỗi hệ thống khi gửi tin nhắn

---

### 3. Gửi Firebase Cloud Messaging (FCM)

**POST** `/api/NotifySend/SendFCM`

**Mô tả**: Gửi thông báo push notification qua Firebase Cloud Messaging.

**Parameters**: Không có

**Request Body**:

```json
{
  "deviceToken": "string (required)",
  "title": "string (required)",
  "body": "string (required)",
  "data": "object (optional, key-value pairs)"
}
```

**Example Request**:

```json
{
  "deviceToken": "fXYZ123abc...device_token_here",
  "title": "Thông báo mới",
  "body": "Bạn có một yêu cầu ticket mới",
  "data": {
    "ticketId": "123",
    "type": "new_ticket",
    "priority": "high"
  }
}
```

**Response Body** (Success):

```json
{
  "success": true,
  "message": "Thông báo FCM đã được gửi thành công"
}
```

**Response Body** (Error):

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    "DeviceToken field is required",
    "Title field is required"
  ]
}
```

**Status Codes**:

- `200`: Gửi thông báo FCM thành công
- `400`: Dữ liệu đầu vào không hợp lệ
- `500`: Lỗi hệ thống khi gửi thông báo

---

## Models

### SendEmailRequest

```csharp
public class SendEmailRequest
{
    [Required]
    [EmailAddress]
    public required string To { get; set; }
    
    [Required]
    public required string Subject { get; set; }
    
    [Required]
    public required string Body { get; set; }
    
    public bool IsHtml { get; set; } = false;
}
```

### SendTelegramRequest

```csharp
public class SendTelegramRequest
{
    [Required]
    public required string ChatId { get; set; }
    
    [Required]
    public required string Message { get; set; }
    
    public string? ParseMode { get; set; } // "HTML" or "Markdown"
}
```

### SendFCMRequest

```csharp
public class SendFCMRequest
{
    [Required]
    public required string DeviceToken { get; set; }
    
    [Required]
    public required string Title { get; set; }
    
    [Required]
    public required string Body { get; set; }
    
    public Dictionary<string, string>? Data { get; set; }
}
```

## Ghi chú

- Tất cả endpoints hiện tại **không yêu cầu Authorization** (đang tạm tắt để testing)
- Validation được thực hiện tự động theo model annotations
- Email hỗ trợ cả plain text và HTML format
- Telegram hỗ trợ parse mode HTML và Markdown
- FCM cho phép gửi thêm custom data payload
- Logs được ghi tự động cho tất cả các thao tác gửi thông báo
- Cần cấu hình SMTP, Telegram Bot Token và Firebase credentials trước khi sử dụng
