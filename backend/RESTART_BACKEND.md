# 🔄 HƯỚNG DẪN RESTART BACKEND

## ⚠️ Quan trọng!

Backend PHẢI được restart sau khi thêm code mới vào `index.js`

## 📋 Các bước thực hiện:

### Bước 1: Dừng Backend hiện tại

Tìm terminal/command prompt đang chạy backend, sau đó:

**Windows:**
```
Ctrl + C
```

Bạn sẽ thấy:
```
^C
Server stopped
```

### Bước 2: Khởi động lại Backend

Trong cùng terminal đó:

```bash
node index.js
```

Bạn sẽ thấy:
```
Server is listening on port 3002
```

### Bước 3: Thêm dữ liệu mẫu (Optional)

Mở terminal MỚI và chạy:

```bash
cd backend
node seed_contacts.js
```

Chọn option:
- `1` = Thêm contacts mẫu (nếu đã có dữ liệu)
- `2` = Xóa hết và thêm mới
- `3` = Hủy

### Bước 4: Reload trang Admin

Trong trình duyệt:
```
F5 (hoặc Ctrl + R)
```

Hoặc mở lại: `http://localhost:4200/admin/contact-adm`

## ✅ Checklist

- [ ] Backend đã restart (port 3002)
- [ ] MongoDB đang chạy
- [ ] Đã chạy seed_contacts.js (có dữ liệu mẫu)
- [ ] Đã reload trang admin
- [ ] Đã đăng nhập với tài khoản admin

## 🔍 Debug

### Kiểm tra Backend có chạy không:

```bash
# Windows
netstat -ano | findstr :3002

# Nếu thấy output → Backend đang chạy ✅
# Nếu không thấy gì → Backend chưa chạy ❌
```

### Test API trực tiếp:

Mở trình duyệt, vào Console (F12), gõ:

```javascript
fetch('http://localhost:3002/feedback', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Kết quả mong đợi:
```json
{
  "feedback": [...],
  "total": 8,
  "page": 1,
  "pages": 1
}
```

### Xem Console errors:

1. Mở trang admin contact
2. F12 → Console tab
3. Xem error message màu đỏ
4. Copy và kiểm tra

### Xem Network errors:

1. F12 → Network tab
2. Reload trang
3. Tìm request `/feedback`
4. Click vào → Xem Response
5. Kiểm tra Status Code:
   - 200 = OK ✅
   - 401 = Unauthorized (chưa login)
   - 403 = Forbidden (không có quyền)
   - 500 = Server error (backend lỗi)

## 🆘 Nếu vẫn lỗi

Copy và gửi cho tôi:
1. Console errors (F12 → Console)
2. Network response (F12 → Network → /feedback → Response)
3. Backend terminal output

