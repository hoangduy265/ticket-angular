# Tickets API Documentation

## Tổng quan

API quản lý tickets (phiếu yêu cầu) trong hệ thống RoyalAPI với các chức năng tạo, cập nhật, thay đổi trạng thái, thay đổi SLAType, lấy danh sách, báo cáo theo khoảng thời gian, health check và upload hình ảnh.

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
    "type": 1,
    "slaType": "A",
    "note": "Additional note",
    "createdBy": 123,
    "createdAt": "2025-10-30T10:00:00Z",
    "closedAt": null,
    "processBy": null,
    "rate": 5,
    "rateAt": "2025-11-12T14:30:00Z",
    "isActive": true
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
    "type": 1,
    "slaType": "A",
    "note": "Additional note",
    "createdBy": 123,
    "createdAt": "2025-10-30T10:00:00Z",
    "closedAt": null,
    "processBy": null,
    "rate": null,
    "rateAt": null,
    "isActive": true
  },
  {
    "id": 2,
    "title": "Another ticket",
    "description": "Another description",
    "status": 1,
    "type": 2,
    "slaType": "B",
    "note": null,
    "createdBy": 456,
    "createdAt": "2025-10-30T11:00:00Z",
    "closedAt": "2025-10-30T12:00:00Z",
    "processBy": 789,
    "rate": 4,
    "rateAt": "2025-11-10T09:15:00Z",
    "isActive": false
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
  "type": "int? (optional)",
  "slaType": "string? (optional)",
  "note": "string? (optional, max 255 chars)",
  "createdBy": "int (required, >0)",
  "closedAt": "datetime? (optional)",
  "assignedTo": "int? (optional, >0)",
  "isActive": "bool (default: true)"
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

### 3.1. Tạo ticket mới (trả về ID)

**POST** `/api/Ticket/CreateTicketReturnId`

**Mô tả**: Tạo ticket và trả về ID vừa tạo.

**Parameters**: Không có

**Request Body**:

```json
{
  "title": "string (required, 1-200 chars)",
  "description": "string (required, 1-1000 chars)",
  "status": 0,
  "type": "int? (optional)",
  "slaType": "string? (optional)",
  "note": "string? (optional, max 255 chars)",
  "createdBy": "int (required, >0)",
  "closedAt": "datetime? (optional)",
  "assignedTo": "int? (optional, >0)",
  "isActive": "bool (default: true)"
}
```

**Response Body**:

```json
{
  "id": 15
}
```

**Status Codes**:

- `200`: Tạo ticket thành công, trả về ID
- `400`: Dữ liệu đầu vào không hợp lệ
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
  "type": "int? (optional)",
  "slaType": "string? (optional)",
  "note": "string? (optional, max 255 chars)",
  "processBy": "int? (optional, >0)",
  "rate": "int? (optional, 1-5)",
  "isActive": "bool? (optional)"
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

### 5.1. Thay đổi SLAType của ticket

**PUT** `/api/Ticket/ChangeSLAType/{id}`

**Mô tả**: Thay đổi loại SLA của một ticket cụ thể.

**Parameters**:

- `id` (int, path): ID của ticket cần thay đổi SLAType

**Request Body**:

```json
{
  "slaType": "string (required, max 50 chars)"
}
```

**Response Body**:

```json
{
  "message": "Ticket SLAType changed successfully"
}
```

**Status Codes**:

- `200`: Thay đổi SLAType thành công
- `400`: Dữ liệu đầu vào không hợp lệ (SLAType null hoặc rỗng)
- `404`: Không tìm thấy ticket
- `500`: Lỗi hệ thống khi thay đổi SLAType

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

**GET** `/api/Ticket/GetList?page=1&pageSize=50&status=0&createdBy=1&processBy=5&search=keyword`

**Mô tả**: Lấy danh sách tickets từ view với phân trang và bộ lọc.

**Parameters**:

- `page` (int, optional, default 1): Số trang
- `pageSize` (int, optional, default 50, max 100): Số items mỗi trang
- `status` (int, optional): Lọc theo trạng thái
- `type` (int, optional): Lọc theo loại ticket
- `slaType` (string, optional): Lọc theo loại SLA
- `createdBy` (int, optional): Lọc theo người tạo
- `processBy` (int, optional): Lọc theo người xử lý
- `rate` (int, optional): Lọc theo đánh giá (1-5 sao)
- `isActive` (bool, optional): Lọc theo trạng thái active (true) hoặc deactive (false)
- `search` (string, optional): Tìm kiếm trong Title/Description/CreatedByName

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
      "type": 1,
      "slaType": "C",
      "note": "Additional note",
      "createdAt": "2025-10-30T10:00:00Z",
      "closedAt": null,
      "createdBy": 123,
      "createdByName": "Nguyen Van A",
      "createdByDepartment": "IT Department",
      "processBy": null,
      "processByName": null,
      "rate": 5,
      "rateAt": "2025-11-12T14:30:00Z",
      "isActive": true
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

### 7.1. Lấy báo cáo tickets theo khoảng thời gian (từ Stored Procedure)

**GET** `/api/Ticket/GetReport?startDate=2025-01-01&endDate=2025-01-31&createdBy=1&page=1&pageSize=50&status=0&type=1&slaType=High&isActive=true&search=keyword`

**Mô tả**: Lấy danh sách tickets từ Stored Procedure `SP_TickestList` với phân trang và bộ lọc mở rộng.

**Parameters**:

- `startDate` (date, required): Ngày bắt đầu
- `endDate` (date, required): Ngày kết thúc
- `createdBy` (int, optional): Lọc theo người tạo
- `page` (int, optional, default 1): Số trang
- `pageSize` (int, optional, default 50, max 100): Số items mỗi trang
- `status` (int, optional): Lọc theo trạng thái
- `type` (int, optional): Lọc theo loại ticket
- `slaType` (string, optional): Lọc theo loại SLA
- `processBy` (int, optional): Lọc theo người xử lý
- `rate` (int, optional): Lọc theo đánh giá
- `isActive` (bool, optional): Lọc theo trạng thái active
- `search` (string, optional): Tìm kiếm trong Title/Description/Note

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
      "type": 1,
      "slaType": "A",
      "note": "Additional note",
      "createdAt": "2025-01-15T10:00:00Z",
      "closedAt": null,
      "createdBy": 123,
      "createdByName": "Nguyen Van A",
      "createdByDepartment": "IT Department",
      "processBy": 456,
      "processByName": "Tran Van B",
      "rate": 5,
      "rateAt": "2025-01-20T14:30:00Z",
      "isActive": true
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
- `400`: Thiếu StartDate hoặc EndDate
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
  "type": 1,
  "slaType": "A",
  "note": "Additional note",
  "createdBy": 123,
  "createdAt": "2025-10-30T10:00:00Z",
  "closedAt": null,
  "processBy": null,
  "rate": 5,
  "rateAt": "2025-11-12T14:30:00Z",
  "isActive": true
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

### 10. Lấy danh sách hình ảnh của ticket

**GET** `/api/Ticket/{ticketId}/Images`

**Mô tả**: Lấy danh sách tất cả hình ảnh đã upload cho một ticket.

**Parameters**:

- `ticketId` (int, path, required, >0): ID của ticket cần lấy hình ảnh

**Request Body**: Không có

**Response Body**:

```json
[
  {
    "id": 15,
    "ticketId": 3,
    "imageUrl": "Data/TicketImage/user_14112025_101500.png",
    "createdAt": "2025-11-14T10:15:00Z"
  },
  {
    "id": 16,
    "ticketId": 3,
    "imageUrl": "Data/TicketImage/user_14112025_102300.png",
    "createdAt": "2025-11-14T10:23:00Z"
  }
]
```

**Status Codes**:

- `200`: Thành công (trả về danh sách, có thể rỗng)
- `400`: ticketId không hợp lệ
- `500`: Lỗi hệ thống

---

### 11. Upload hình ảnh cho ticket

**POST** `/api/Ticket/UploadImageTicket`

**Mô tả**: Upload hình ảnh cho ticket và lưu thông tin vào database.

**Headers**:

- `Authorization`: Bearer token (bắt buộc)

**Form Data**:

- `file`: IFormFile (file hình ảnh)
- `userId`: int (ID của user upload)
- `ticketId`: int (ID của ticket cần gắn hình ảnh)

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
    public int? Type { get; set; }
    public string? SLAType { get; set; }
    public string? Note { get; set; }
    public required int CreatedBy { get; set; }
    public required DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public int? AssignedTo { get; set; } // Tên cột trong DB (mapped to ProcessBy in DTOs)
    public int? Rate { get; set; } // Đánh giá từ 1-5 sao
    public DateTime? RateAt { get; set; } // Ngày đánh giá
    public bool IsActive { get; set; } = true;
}
```

### TicketRequest

```csharp
public class TicketRequest
{
    [Required, StringLength(200, MinimumLength = 1)]
    public required string Title { get; set; }
    
    [Required, StringLength(1000, MinimumLength = 1)]
    public required string Description { get; set; }
    
    public int Status { get; set; } = 0;
    public int? Type { get; set; }
    public string? SLAType { get; set; }
    
    [StringLength(255)]
    public string? Note { get; set; }
    
    [Required, Range(1, int.MaxValue)]
    public required int CreatedBy { get; set; }
    
    public DateTime? ClosedAt { get; set; } = null;
    
    [Range(1, int.MaxValue)]
    public int? ProcessBy { get; set; } = null;
    
    public bool IsActive { get; set; } = true;
}
```

### UpdateTicketRequest

```csharp
public class UpdateTicketRequest
{
    [StringLength(200, MinimumLength = 1)]
    public string? Title { get; set; }

    [StringLength(1000, MinimumLength = 1)]
    public string? Description { get; set; }
    
    public int? Type { get; set; }
    public string? SLAType { get; set; }
    
    [StringLength(255)]
    public string? Note { get; set; }

    [Range(1, int.MaxValue)]
    public int? ProcessBy { get; set; }

    [Range(1, 5)]
    public int? Rate { get; set; }
    
    public bool? IsActive { get; set; }
}
```

### RateTicketRequest

```csharp
public class RateTicketRequest
{
    [Required, Range(1, 5)]
    public required int Rate { get; set; }
}
```

### ChangeSLATypeRequest

```csharp
public class ChangeSLATypeRequest
{
    [Required, StringLength(50)]
    public required string SLAType { get; set; }
}
```

### TicketFilterRequest

```csharp
public class TicketFilterRequest
{
    public int? Status { get; set; }
    public int? Type { get; set; }
    public string? SLAType { get; set; }
    public int? CreatedBy { get; set; }
    public int? ProcessBy { get; set; }
    public int? Rate { get; set; }
    public bool? IsActive { get; set; }
    public string? Search { get; set; } // Tìm theo Title/Description/CreatedByName
}
```

### TicketReportRequest

```csharp
public class TicketReportRequest
{
    [Required]
    public required DateTime StartDate { get; set; }
    
    [Required]
    public required DateTime EndDate { get; set; }
    
    public int? CreatedBy { get; set; }
    public int? Status { get; set; }
    public int? Type { get; set; }
    public string? SLAType { get; set; }
    public int? ProcessBy { get; set; }
    public int? Rate { get; set; }
    public bool? IsActive { get; set; }
    public string? Search { get; set; }
}
```

### TicketListView

```csharp
public class TicketListView
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? Status { get; set; }
    public int? Type { get; set; }
    public string? SLAType { get; set; }
    public string? Note { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public string? CreatedByDepartment { get; set; }
    public int? ProcessBy { get; set; }
    public string? ProcessByName { get; set; }
    public int? Rate { get; set; }
    public DateTime? RateAt { get; set; }
    public bool? IsActive { get; set; }
}
```

### TicketImageModel

```csharp
public class TicketImageModel
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public string ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

## Ghi chú

- `Status`: 0 = Mới tạo, 1 = Đang xử lý, 2 = Hoàn thành, 3 = Đang treo (có thể mở rộng)
- `Type`: 1 = Phần cứng, 2 = Phần mềm, 3 = Mạng, 4 = Camera - Chấm công, 5 = Máy in, 6 = PM văn phòng, 7 = PM thiết kế, 8 = Khác
- `SLAType`: Loại SLA tương ứng với mốc thời gian phải xử lý ticket
  - A = 1 giờ
  - B = 2 giờ
  - C = 4 giờ
  - D = 8 giờ
  - E = 24 giờ
  - F = 48 giờ
  - G = 72 giờ
  - Z = Không xác định
- `CreatedBy`: ID của user tạo ticket
- `CreatedByName`: Tên của user tạo ticket (chỉ có trong TicketListView)
- `CreatedByDepartment`: Phòng ban của user tạo ticket (chỉ có trong TicketListView)
- `ProcessBy`: ID của user xử lý ticket (có thể null, tương ứng với cột AssignedTo trong DB)
- `ProcessByName`: Tên của user xử lý ticket (chỉ có trong TicketListView, có thể null)
- `Rate`: Đánh giá từ 1-5 sao (có thể null nếu chưa đánh giá)
- `RateAt`: Thời gian đánh giá (có thể null nếu chưa đánh giá)
- `Note`: Ghi chú của ticket, ví dụ: ID và Pass Ultraview (max 255 ký tự)
- `IsActive`: true = Active, false = Deactive
- **Lưu ý về Database**: Cột trong DB là `AssignedTo` nhưng được map thành `ProcessBy` trong API/DTOs
- Tất cả thời gian đều theo UTC+7
- Tất cả endpoints (trừ HealthCheck) đều yêu cầu Authorization header
- Validation được thực hiện theo model contracts
- Logs được ghi cho các thao tác quan trọng
- Endpoint GetList trả về `TicketListView` với thông tin join từ bảng Users
- Endpoint GetReport sử dụng Stored Procedure `SP_TickestList` và trả về `TicketListView`
- Upload hình ảnh sẽ tự động lưu metadata vào bảng TicketImages
