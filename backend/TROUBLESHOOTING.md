# 🔧 Hướng dẫn khắc phục lỗi Blog Management

## ✅ Checklist đầy đủ

### 1. Kiểm tra Backend đang chạy

```bash
# Terminal 1: Backend
cd backend
node index.js
```

Bạn phải thấy:
```
Server is listening on port 3002
```

### 2. Kiểm tra Frontend đang chạy

```bash
# Terminal 2: Frontend
cd frontend
ng serve
```

Bạn phải thấy:
```
** Angular Live Development Server is listening on localhost:4200 **
```

### 3. Kiểm tra có blog trong database

```bash
cd backend
node seed_blogs.js
```

Kết quả mong đợi:
```
✅ Successfully inserted 5 blogs!
```

### 4. Test API

```bash
cd backend
node test_blog_api.js
```

Kết quả mong đợi:
```
✅ GET /blogs - SUCCESS
   Found 5 blogs
```

### 5. Kiểm tra đăng nhập Admin

1. Mở `http://localhost:4200`
2. Đăng nhập với tài khoản admin
3. Kiểm tra trong Console (F12):
   ```javascript
   // Không có lỗi authentication
   ```

### 6. Truy cập trang Blog Management

URL: `http://localhost:4200/admin/blog-adm`

Hoặc: Menu → Chức năng → Blogs

---

## 🐛 Lỗi thường gặp

### Lỗi 1: "Không thể tải danh sách blog"

**Nguyên nhân:** Backend chưa chạy hoặc chưa có blog

**Giải pháp:**
```bash
# 1. Kiểm tra backend
cd backend
node index.js

# 2. Thêm blog mẫu
node seed_blogs.js

# 3. Test API
node test_blog_api.js
```

### Lỗi 2: "401 Unauthorized" hoặc "403 Forbidden"

**Nguyên nhân:** Chưa đăng nhập hoặc không có quyền admin

**Giải pháp:**
1. Đăng xuất và đăng nhập lại
2. Kiểm tra tài khoản có `role: "admin"`
3. Kiểm tra `action: "edit all"` hoặc `"sales ctrl"` hoặc `"just view"`

### Lỗi 3: Network Error / ERR_CONNECTION_REFUSED

**Nguyên nhân:** Backend không chạy hoặc sai port

**Giải pháp:**
```bash
# Kiểm tra backend có chạy không
netstat -ano | findstr :3002

# Nếu không có, khởi động lại
cd backend
node index.js
```

### Lỗi 4: Trang hiển thị "Không có blog nào"

**Nguyên nhân:** Database trống hoặc query không đúng

**Giải pháp:**
```bash
# 1. Thêm blog mẫu
cd backend
node seed_blogs.js

# 2. Mở Console (F12) và kiểm tra:
# - Tab Network: Xem HTTP request/response
# - Tab Console: Xem error logs
```

### Lỗi 5: CORS Error

**Nguyên nhân:** Frontend và backend chạy khác origin

**Giải pháp:** Kiểm tra `backend/index.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:4200',  // ← Phải đúng port này
  credentials: true
}));
```

---

## 🔍 Debug Mode

### Frontend Debug:

1. Mở DevTools (F12)
2. Vào tab **Console**
3. Tìm log: `Error loading blogs:`
4. Copy error message đầy đủ

### Backend Debug:

1. Xem terminal chạy backend
2. Tìm error logs màu đỏ
3. Kiểm tra:
   - `Blog collection not initialized` → Database chưa connect
   - `Forbidden` → Không có quyền
   - `Internal Server Error` → Lỗi code

### Network Debug:

1. Mở DevTools (F12)
2. Vào tab **Network**
3. Reload trang
4. Tìm request `/blogs/admin/list`
5. Xem:
   - Status Code (200 = OK, 401 = Unauthorized, 403 = Forbidden, 500 = Server Error)
   - Response: Xem message lỗi
   - Headers: Kiểm tra cookies, credentials

---

## 📊 Kiểm tra Database trực tiếp

### Sử dụng MongoDB Compass:

1. Connect: `mongodb://localhost:27017`
2. Database: `dacsan3mien`
3. Collection: `Blog`
4. Kiểm tra có documents không

### Sử dụng mongo shell:

```bash
mongo
use dacsan3mien
db.Blog.find().pretty()
db.Blog.countDocuments()
```

---

## 🆘 Nếu vẫn không được

### Thu thập thông tin debug:

1. **Backend logs:**
   - Copy toàn bộ terminal output

2. **Frontend Console:**
   - F12 → Console → Copy all errors

3. **Network requests:**
   - F12 → Network → Right-click request → Copy → Copy as cURL

4. **Screenshots:**
   - Chụp màn hình trang lỗi
   - Chụp console errors
   - Chụp network tab

### Các câu lệnh hữu ích:

```bash
# Kiểm tra port đang được sử dụng
netstat -ano | findstr :3002
netstat -ano | findstr :4200

# Kill process nếu cần
taskkill /PID <PID> /F

# Xem log backend chi tiết
cd backend
node index.js 2>&1 | tee backend.log

# Test MongoDB connection
cd backend
node checkMongo.js
```

---

## ✅ Khi mọi thứ hoạt động:

Bạn sẽ thấy:
- ✅ Danh sách 5 blogs trong bảng
- ✅ Có thể tìm kiếm blog
- ✅ Có thể thêm blog mới
- ✅ Có thể sửa blog
- ✅ Có thể xóa blog
- ✅ Có thể phân trang

Chúc may mắn! 🚀

