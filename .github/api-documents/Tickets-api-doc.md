# Tickets API Documentation

## Tổng quan

API quản lý tickets (phiếu yêu cầu) trong hệ thống RoyalAPI với các chức năng tạo, cập nhật, thay đổi trạng thái, lấy danh sách, health check và upload hình ảnh.

## Endpoints

### 1. Lấy danh sách tickets theo User ID

**GET** `/api/Ticket/GetTicketByUserId?userId=1`

**Mô tả**: Lấy danh sách tất cả tickets được tạo bởi một user cụ thể.

**Parameters**:

- `userId` (int, required, >0): ID của user cần lấy tickets

**Request Body**: Không có

**Response Body**:

```json
[
  {
    "id": 1,
    "title": "Ticket title",
    "description": "Ticket description",
    "status": 0,
    "createdBy": 123,
    "createdAt": "2025-10-30T10:00:00Z",
    "closedAt": null,
    "assignedTo": null,
    "rate": 5,
    "rateAt": "2025-11-12T14:30:00Z"
  }
]
```

**Status Codes**:

- `200`: Thành công
- `400`: User ID không hợp lệ
- `404`: Không tìm thấy tickets

---

### 2. Lấy tất cả tickets

**GET** `/api/Ticket/GetAllTickets`

**Mô tả**: Lấy danh sách tất cả tickets trong hệ thống.

**Parameters**: Không có

**Request Body**: Không có

**Response Body**:

```json
[
  {
    "id": 1,
    "title": "Ticket title",
    "description": "Ticket description",
    "status": 0,
    "createdBy": 123,
    "createdAt": "2025-10-30T10:00:00Z",
    "closedAt": null,
    "assignedTo": null,
    "rate": null,
    "rateAt": null
  },
  {
    "id": 2,
    "title": "Another ticket",
    "description": "Another description",
    "status": 1,
    "createdBy": 456,
    "createdAt": "2025-10-30T11:00:00Z",
    "closedAt": "2025-10-30T12:00:00Z",
    "assignedTo": 789,
    "rate": 4,
    "rateAt": "2025-11-10T09:15:00Z"
  }
]
```

**Status Codes**:

- `200`: Thành công
- `404`: Không tìm thấy tickets nào
- `500`: Lỗi hệ thống

---

### 3. Tạo ticket mới

**POST** `/api/Ticket/CreateTicket`

**Mô tả**: Tạo một ticket mới trong hệ thống.

**Parameters**: Không có

**Request Body**:

```json
{
  "title": "string (required, 1-200 chars)",
  "description": "string (required, 1-1000 chars)",
  "status": 0,
  "createdBy": "int (required, >0)",
  "closedAt": "datetime? (optional)",
  "assignedTo": "int? (optional, >0)"
}
```

**Response Body**:

```json
{
  "code": 200,
  "message": "Ticket created successfully"
}
```

**Status Codes**:

- `200`: Tạo ticket thành công
- `400`: Dữ liệu đầu vào không hợp lệ (thiếu title, description, hoặc request null)
- `500`: Lỗi hệ thống khi tạo ticket

---

### 4. Cập nhật ticket

**PUT** `/api/Ticket/UpdateTicket/{id}`

**Mô tả**: Cập nhật thông tin của một ticket cụ thể.

**Parameters**:

- `id` (int, path): ID của ticket cần cập nhật

**Request Body**:

```json
{
  "title": "string? (optional, 1-200 chars)",
  "description": "string? (optional, 1-1000 chars)",
  "assignedTo": "int? (optional, >0)",
  "rate": "int? (optional, 1-5)"
}
```

**Response Body**:

```json
{
  "message": "Ticket updated successfully"
}
```

**Status Codes**:

- `200`: Cập nhật thành công
- `400`: Dữ liệu đầu vào không hợp lệ
- `404`: Không tìm thấy ticket
- `500`: Lỗi hệ thống khi cập nhật

---

### 5. Thay đổi trạng thái ticket

**PUT** `/api/Ticket/ChangeStatus/{id}`

**Mô tả**: Thay đổi trạng thái của một ticket cụ thể.

**Parameters**:

- `id` (int, path): ID của ticket cần thay đổi trạng thái

**Request Body**:

```json
{
  "status": "int (required, >=0)"
}
```

**Response Body**:

```json
{
  "message": "Ticket status changed successfully"
}
```

**Status Codes**:

- `200`: Thay đổi trạng thái thành công
- `400`: Dữ liệu đầu vào không hợp lệ
- `404`: Không tìm thấy ticket
- `500`: Lỗi hệ thống khi thay đổi trạng thái

---

### 6. Đánh giá ticket

**PUT** `/api/Ticket/RateTicket/{id}`

**Mô tả**: Đánh giá ticket với số sao từ 1-5.

**Parameters**:

- `id` (int, path): ID của ticket cần đánh giá

**Request Body**:

```json
{
  "rate": "int (required, 1-5)"
}
```

**Response Body**:

```json
{
  "message": "Ticket rated successfully"
}
```

**Status Codes**:

- `200`: Đánh giá thành công
- `400`: Dữ liệu đầu vào không hợp lệ hoặc rate không trong khoảng 1-5
- `404`: Không tìm thấy ticket
- `500`: Lỗi hệ thống khi đánh giá

---

### 7. Lấy danh sách tickets có phân trang

**GET** `/api/Ticket/GetList?page=1&pageSize=50&status=0&createdBy=1&assignedTo=2&search=keyword`

**Mô tả**: Lấy danh sách tickets từ view với phân trang và bộ lọc.

**Parameters**:

- `page` (int, optional, default 1): Số trang
- `pageSize` (int, optional, default 50, max 100): Số items mỗi trang
- `status` (int, optional): Lọc theo trạng thái
- `createdBy` (int, optional): Lọc theo người tạo
- `assignedTo` (int, optional): Lọc theo người được assign
- `search` (string, optional): Tìm kiếm trong Title/Description

**Request Body**: Không có

**Response Body**:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Ticket title",
      "description": "Ticket description",
      "status": 0,
      "createdBy": 123,
      "createdAt": "2025-10-30T10:00:00Z",
      "closedAt": null,
      "assignedTo": null,
      "rate": 5,
      "rateAt": "2025-11-12T14:30:00Z"
    }
  ],
  "currentPage": 1,
  "pageSize": 50,
  "totalCount": 100,
  "totalPages": 2,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

**Status Codes**:

- `200`: Thành công
- `500`: Lỗi hệ thống

---

### 8. Lấy ticket theo ID

**GET** `/api/Ticket/GetById/{id}`

**Mô tả**: Lấy thông tin chi tiết của một ticket cụ thể.

**Parameters**:

- `id` (int, path): ID của ticket cần lấy

**Request Body**: Không có

**Response Body**:

```json
{
  "id": 1,
  "title": "Ticket title",
  "description": "Ticket description",
  "status": 0,
  "createdBy": 123,
  "createdAt": "2025-10-30T10:00:00Z",
  "closedAt": null,
  "assignedTo": null,
  "rate": 5,
  "rateAt": "2025-11-12T14:30:00Z"
}
```

**Status Codes**:

- `200`: Thành công
- `400`: ID không hợp lệ
- `404`: Không tìm thấy ticket
- `500`: Lỗi hệ thống

---

### 9. Health Check

**GET** `/api/Ticket/HealthCheck`

**Mô tả**: Kiểm tra trạng thái hoạt động của dịch vụ ticket.

**Parameters**: Không có

**Request Body**: Không có

**Response Body**:

```json
{
  "status": "Healthy",
  "service": "TicketController",
  "timestamp": "2025-11-07T...",
  "message": "Dịch vụ ticket hoạt động bình thường"
}
```

**Status Codes**:

- `200`: Dịch vụ hoạt động bình thường

---

### 10. Upload hình ảnh cho ticket

**POST** `/api/Ticket/UploadImage`

**Mô tả**: Upload hình ảnh cho ticket.

**Headers**:

- `Authorization`: Bearer token (bắt buộc)

**Form Data**:

- `file`: IFormFile (file hình ảnh)
- `userId`: int (ID của user upload)

**Request Body**: Không có

**Response Body**:

```json
{
  "message": "File uploaded successfully.",
  "uploadedFile": {
    "fileName": "image.jpg",
    "filePath": "/uploads/tickets/image.jpg",
    "fileSize": 1024000
  }
}
```

**Status Codes**:

- `200`: Upload thành công
- `400`: File không hợp lệ hoặc thiếu dữ liệu
- `500`: Lỗi hệ thống khi upload

## Models

### TicketModel

```csharp
public class TicketModel
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required int Status { get; set; }
    public required int CreatedBy { get; set; }
    public required DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public int? AssignedTo { get; set; }
    public int? Rate { get; set; } // Đánh giá từ 1-5 sao
    public DateTime? RateAt { get; set; } // Ngày đánh giá
}
```

### TicketRequest

```csharp
public class TicketRequest
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public int Status { get; set; } = 0;
    public required int CreatedBy { get; set; }
    public required DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? ClosedAt { get; set; } = null;
    public int? AssignedTo { get; set; } = null;
}
```

### UpdateTicketRequest

```csharp
public class UpdateTicketRequest
{
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Title phải từ 1 đến 200 ký tự")]
    public string? Title { get; set; }

    [StringLength(1000, MinimumLength = 1, ErrorMessage = "Description phải từ 1 đến 1000 ký tự")]
    public string? Description { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "AssignedTo phải lớn hơn 0 nếu có")]
    public int? AssignedTo { get; set; }

    [Range(1, 5, ErrorMessage = "Rate phải từ 1 đến 5 sao nếu có")]
    public int? Rate { get; set; }
}
```

### RateTicketRequest

```csharp
public class RateTicketRequest
{
    [Required, Range(1, 5, ErrorMessage = "Rate phải từ 1 đến 5 sao")]
    public required int Rate { get; set; }
}
```

### TicketFilterRequest

```csharp
public class TicketFilterRequest
{
    public int? Status { get; set; }
    public int? CreatedBy { get; set; }
    public int? AssignedTo { get; set; }
    public int? Rate { get; set; } // Lọc theo đánh giá (1-5 sao) - chưa implement do database view chưa có
    public string? Search { get; set; } // Tìm theo Title hoặc Description
}
```

## Ghi chú

- `Status`: 0 = Created, 1 = In Progress, 2 = Closed (có thể mở rộng)
- `CreatedBy`: ID của user tạo ticket
- `AssignedTo`: ID của user được assign ticket (có thể null)
- `Rate`: Đánh giá từ 1-5 sao (có thể null nếu chưa đánh giá)
- `RateAt`: Thời gian đánh giá (có thể null nếu chưa đánh giá)
- Tất cả thời gian đều theo UTC+7
- Tất cả endpoints (trừ HealthCheck) đều yêu cầu Authorization header
- Validation được thực hiện theo model contracts
- Logs được ghi cho các thao tác quan trọng
- Endpoint GetList hỗ trợ lọc theo: status, createdBy, assignedTo, search (rate filter sẽ được thêm sau khi cập nhật database view)
