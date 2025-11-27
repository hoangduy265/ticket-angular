# API endpoint liên quan đến user

## 1 Lấy danh sách người dùng theo phòng ban

**GET** `/api/User/GetUsersByDepartment/{departmentId}`

**Path Parameters:**

- `departmentId` (int, required): ID của phòng ban

**Response Success (200):**

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "username": "john_doe",
    "personalEmail": "john@personal.com",
    "workEmail": "john@company.com",
    "address": "123 Main St",
    "phoneNumber": "0123456789",
    "state": true,
    "departmentId": 1,
    "departmentName": "IT Department",
    "companyId": 1,
    "companyName": "Company ABC",
    "deviceId": "DEVICE-123",
    "createAt": "2024-01-15T10:00:00Z",
    "updateAt": "2024-12-13T14:30:00Z",
    "note": "Additional notes",
    "emailConfirmed": true,
    "phoneNumberConfirmed": true,
    "twoFactorEnabled": false,
    "lockoutEnd": null
  }
]
```

**Response Error (400):**

```json
{
  "message": "Invalid DepartmentId."
}
```

**Response Error (500):**

```json
{
  "message": "An error occurred while retrieving users.",
  "error": "Error details"
}
```
