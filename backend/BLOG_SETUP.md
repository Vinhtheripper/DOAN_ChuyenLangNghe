# Hướng dẫn thiết lập và sử dụng Blog Management

## 🚀 Cách khởi động

### 1. Khởi động Backend

```bash
cd backend
node index.js
```

Bạn sẽ thấy:
```
Server is listening on port 3002
```

### 2. Test API (Tùy chọn)

Chạy script test để kiểm tra API có hoạt động không:

```bash
node test_blog_api.js
```

### 3. Khởi động Frontend

Mở terminal mới:

```bash
cd frontend
ng serve
```

### 4. Truy cập trang Admin

1. Mở trình duyệt: `http://localhost:4200`
2. Đăng nhập với tài khoản admin
3. Vào menu: **Chức năng → Blogs**
4. Hoặc trực tiếp: `http://localhost:4200/admin/blog-adm`

## 🔧 Khắc phục lỗi "Không thể tải danh sách blog"

### Nguyên nhân có thể:

1. **Backend chưa khởi động hoặc chưa restart sau khi thêm code mới**
   - Giải pháp: Dừng backend (Ctrl+C) và chạy lại `node index.js`

2. **MongoDB chưa khởi động**
   - Giải pháp: Khởi động MongoDB service
   - Windows: `net start MongoDB`
   - Linux/Mac: `sudo systemctl start mongod`

3. **Chưa đăng nhập hoặc không có quyền admin**
   - Giải pháp: Đăng nhập với tài khoản có role = "admin"

4. **Port 3002 đã bị sử dụng**
   - Giải pháp: Tìm và dừng process đang dùng port 3002
   - Windows: `netstat -ano | findstr :3002`

### Kiểm tra chi tiết:

1. **Mở Console trong trình duyệt** (F12)
   - Xem tab Network để kiểm tra HTTP requests
   - Xem tab Console để xem error logs

2. **Kiểm tra terminal backend**
   - Xem có error logs không
   - Xác nhận "Blog collection" đã được khởi tạo

3. **Test API trực tiếp**
   ```bash
   node test_blog_api.js
   ```

## 📝 API Endpoints

### Public Endpoints

- `GET /blogs` - Lấy danh sách blog (đã xuất bản)
- `GET /blogs/:id` - Lấy chi tiết 1 blog

### Admin Endpoints (Yêu cầu authentication)

- `GET /blogs/admin/list` - Lấy tất cả blog (kể cả nháp)
- `POST /blogs` - Tạo blog mới
- `PATCH /blogs/:id` - Cập nhật blog
- `DELETE /blogs/:id` - Xóa blog

## 🔑 Quyền truy cập

Để quản lý blog, tài khoản phải có:
- **role**: "admin"
- **action**: "edit all" hoặc "sales ctrl" (để tạo/sửa/xóa)
- **action**: "just view" (chỉ xem)

## 📊 Cấu trúc dữ liệu Blog

```javascript
{
  _id: ObjectId,
  title: String,           // Tiêu đề (bắt buộc)
  description: String,     // Mô tả ngắn
  content: String,         // Nội dung (bắt buộc)
  image: String,           // Hình ảnh (Base64)
  author: String,          // Tác giả (mặc định: "Admin")
  published: Boolean,      // Trạng thái (mặc định: true)
  createdAt: Date,         // Ngày tạo
  updatedAt: Date          // Ngày cập nhật
}
```

## 💡 Mẹo sử dụng

1. **Tìm kiếm nhanh**: Gõ từ khóa và nhấn Enter
2. **Upload ảnh**: Chọn file ảnh, hệ thống tự động chuyển sang Base64
3. **Lưu nháp**: Chọn trạng thái "Nháp" để lưu blog chưa xuất bản
4. **Xem trước**: Sau khi tạo, có thể xem blog ở trang public

## 🐛 Debug Mode

Nếu vẫn gặp lỗi, bật debug mode:

1. Mở `frontend/src/app/admin/blog-management/blog-management.component.ts`
2. Trong method `loadBlogs()`, xem console.error logs
3. Kiểm tra Network tab trong DevTools

## 📞 Hỗ trợ

Nếu vẫn gặp vấn đề, cung cấp thông tin:
- Error message đầy đủ từ console
- Backend logs
- Screenshots nếu có

