# Device Token API

## 1. Đăng ký device token

- **URL**: `/api/DeviceTokens`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:

```json
{
    "userId": 12,
    "deviceToken": "fcm-token-value",
    "platform": "android"
}
```

- **Response 200**:

```json
{
    "success": true,
    "data": {
        "id": 5,
        "userId": 12,
        "deviceToken": "fcm-token-value",
        "platform": "android",
        "createdAt": "2025-11-13T04:35:12.000Z",
        "updatedAt": "2025-11-13T04:35:12.000Z",
        "isActive": true
    }
}
```

- **Response 400**: Dữ liệu đầu vào không hợp lệ.

## 2. Lấy danh sách token theo user

- **URL**: `/api/DeviceTokens/user/{userId}`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response 200**:

```json
{
    "success": true,
    "data": [
        {
            "id": 5,
            "userId": 12,
            "deviceToken": "fcm-token-value",
            "platform": "android",
            "createdAt": "2025-11-13T04:35:12.000Z",
            "updatedAt": "2025-11-13T04:35:12.000Z",
            "isActive": true
        }
    ]
}
```

- **Response 200 (không có dữ liệu)**: `data` là mảng rỗng.

## 3. Cập nhật device token

- **URL**: `/api/DeviceTokens/{id}`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body** (ít nhất một trường):

```json
{
    "userId": 15,
    "platform": "ios",
    "isActive": true
}
```

- **Response 200**:

```json
{
    "success": true,
    "data": {
        "id": 5,
        "userId": 15,
        "deviceToken": "fcm-token-value",
        "platform": "ios",
        "createdAt": "2025-11-13T04:35:12.000Z",
        "updatedAt": "2025-11-13T05:00:41.000Z",
        "isActive": true
    }
}
```

- **Response 400**: Dữ liệu đầu vào không hợp lệ.
- **Response 404**: Không tìm thấy device token.

## 4. Vô hiệu hóa device token

- **URL**: `/api/DeviceTokens/{id}`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`
- **Response 200**:

```json
{
    "success": true,
    "message": "Device token đã được vô hiệu hóa"
}
```

- **Response 404**: Không tìm thấy device token.
