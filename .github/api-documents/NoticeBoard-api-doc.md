# NoticeBoard API Documentation

## Tổng quan

- Các API hiển thị NoticeBoard (bảng thông báo) cho người dùng trên website.
- trong fields `content` có chứa iframe youtube.

**Authentication**: Tất cả endpoints (trừ `/health`) yêu cầu JWT token trong header `Authorization: Bearer {token}`.

## Endpoints

### 1. Lấy NoticeBoard theo ID

**GET** `/api/NoticeBoard/{id}`

**Mô tả**: Lấy thông tin chi tiết của một NoticeBoard cụ thể.

**Headers**:

- `Authorization: Bearer {jwt_token}` (bắt buộc)

**Parameters**:

- `id` (int, path, required): ID của NoticeBoard cần lấy

**Request Body**: Không có

**Response Body**:

```json
{
  "success": true,
  "message": "Notice board retrieved successfully",
  "data": {
    "id": 1,
    "title": "Thông báo nghỉ lễ",
    "content": "Nội dung thông báo...",
    "type": 1,
    "priority": 2,
    "startDate": "2025-11-20T00:00:00Z",
    "endDate": "2025-11-25T23:59:59Z",
    "targetAudience": 1,
    "isActive": true,
    "createdBy": 123,
    "createdAt": "2025-11-20T10:00:00Z",
    "updatedAt": null
  }
}
```

**Status Codes**:

- `200`: Thành công
- `400`: ID không hợp lệ
- `404`: Không tìm thấy NoticeBoard
- `500`: Lỗi hệ thống

---

### 2. Lấy danh sách NoticeBoard active cho Web (Chỉ hiển thị 5 record mới nhất)

**GET** `/api/NoticeBoard/web`

**Mô tả**: Lấy danh sách NoticeBoard đang active dành cho web.

**Headers**:

- `Authorization: Bearer {jwt_token}` (bắt buộc)

**Parameters**: Không có

**Request Body**: Không có

**Response Body**:

```json
{
  "success": true,
  "message": "Web notice boards retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Thông báo nghỉ lễ",
      "content": "Nội dung thông báo...",
      "type": 1,
      "priority": 2,
      "startDate": "2025-11-20T00:00:00Z",
      "endDate": "2025-11-25T23:59:59Z",
      "targetAudience": 1,
      "isActive": true,
      "createdBy": 123,
      "createdAt": "2025-11-20T10:00:00Z",
      "updatedAt": null
    }
  ],
  "count": 5
}
```

**Status Codes**:

- `200`: Thành công
- `500`: Lỗi hệ thống

---

### 3. Lấy NoticeBoard gần đây (Lấy 1 cái gần nhất )

**GET** `/api/NoticeBoard/recent?count=1`

**Mô tả**: Lấy danh sách NoticeBoard trong 30 ngày gần nhất.

**Headers**:

- `Authorization: Bearer {jwt_token}` (bắt buộc)

**Parameters**:

- `count` (int, optional, default 1, max 100): Số lượng NoticeBoard cần lấy

**Request Body**: Không có

**Response Body**:

```json
{
  "success": true,
  "message": "Recent notice boards retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Thông báo nghỉ lễ",
      "content": "Nội dung thông báo...",
      "type": 1,
      "priority": 2,
      "startDate": "2025-11-20T00:00:00Z",
      "endDate": "2025-11-25T23:59:59Z",
      "targetAudience": 1,
      "isActive": true,
      "createdBy": 123,
      "createdAt": "2025-11-20T10:00:00Z",
      "updatedAt": null
    }
  ],
  "count": 5
}
```

**Status Codes**:

- `200`: Thành công
- `400`: Tham số count không hợp lệ
- `500`: Lỗi hệ thống

---

### 13. Health Check

**GET** `/api/NoticeBoard/health`

**Mô tả**: Kiểm tra trạng thái hoạt động của dịch vụ NoticeBoard.

**Parameters**: Không có

**Request Body**: Không có

**Response Body**:

```json
{
  "success": true,
  "message": "Notice board service is healthy",
  "timestamp": "2025-11-20T10:00:00Z",
  "service": "NoticeBoardService",
  "version": "1.0.0",
  "stats": {
    "totalNoticeBoards": 25,
    "activeNoticeBoards": 20
  }
}
```

**Status Codes**:

- `200`: Dịch vụ hoạt động bình thường
- `503`: Dịch vụ không hoạt động

## Models

### NoticeBoardModel

```csharp
public class NoticeBoardModel
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public required int Type { get; set; }
    public required int Priority { get; set; }
    public required DateTime StartDate { get; set; }
    public required DateTime EndDate { get; set; }
    public required int TargetAudience { get; set; }
    public bool IsActive { get; set; } = true;
    public required int CreatedBy { get; set; }
    public required DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

## Ghi chú

- `Type`: 1 = Thông báo chung, 2 = Thông báo khẩn cấp, 3 = Thông báo sự kiện
- `Priority`: 1 = Thấp, 2 = Trung bình, 3 = Cao
- `IsActive`: true = Active, false = Inactive (soft delete)
- Tất cả thời gian đều theo UTC+7
- **Authentication**: Endpoint `/health` không yêu cầu authentication. Các endpoint khác bắt buộc có JWT token trong header `Authorization: Bearer {token}`
- Validation được thực hiện theo model contracts
- Logs được ghi cho các thao tác quan trọng (create, update, delete)
- Soft delete chỉ set `IsActive = false`, không xóa khỏi database
- Hard delete xóa vĩnh viễn khỏi database (cẩn thận khi sử dụng)
