Giới thiệu
Chào mừng bạn đến với dự án website Chuyện Làng Nghề được xây dựng bằng Angular Framework kết nối đến MongoDB. Dự án bao gồm một backend Node.js sử dụng MongoDB làm cơ sở dữ liệu và một frontend được xây dựng bằng Angular. Các file JSON được dùng để import dữ liệu cấu hình hệ thống.

Thông tin đăng nhập
*Tài khoản admin của website: admin@uel.edu.vn
*Tài khoản user của website: user@uel.edu.vn                                                                     
Các tài khoản khác có thể thay phần local-part, password giữ nguyên
*Mật khẩu: 112233

Cấu hình môi trường
*Yêu cầu hệ thống
- Node.js phiên bản 14.x trở lên
- MongoDB cài đặt local hoặc sử dụng dịch vụ MongoDB Atlas
- Angular CLI phiên bản 14.x trở lên
- Git LFS dùng để quản lý file media dung lượng lớn: chạy git lfs install trước khi git clone.

*Cài đặt các gói phụ thuộc
Trước tiên, cần cài đặt các gói phụ thuộc cho cả frontend và backend. Đảm bảo rằng máy tính của bạn đã cài Node.js và npm (Node Package Manager).

*Cài đặt gói cho backend (Node.js)
Mở terminal hoặc command prompt và điều hướng đến thư mục backend của dự án.
Chạy lệnh sau để cài đặt các package:
	cd backend
	npm install

*Cài đặt gói cho frontend (Angular)
Điều hướng đến thư mục frontend của dự án.
Chạy lệnh sau:
	cd frontend
	npm install

*Cấu hình MongoDB
Trong file backend/.env, thiết lập chuỗi kết nối MongoDB phù hợp với môi trường của bạn. Ví dụ:
MONGO_URI=mongodb://localhost:27017/DACSAN3MIEN
JWT_SECRET=<tuy_chon>
Nếu sử dụng MongoDB Atlas, thay localhost bằng URI của Atlas.

Cách chạy ứng dụng
1. Chạy backend (Node.js)
- Di chuyển đến thư mục backend và chạy lệnh:
	node index.js
- Server mặc định chạy tại địa chỉ: http://localhost:3000/

2. Chạy frontend (Angular)
- Di chuyển đến thư mục frontend và chạy lệnh:
	ng serve
- Ứng dụng hiển thị tại địa chỉ: http://localhost:4200/

*Import dữ liệu mẫu
Dự án hỗ trợ import dữ liệu từ các file JSON mẫu trong thư mục GROUP 5_ DATA của drive nhóm. Đảm bảo rằng bạn đã có các file JSON cần thiết và import chúng vào MongoDB. Bạn có thể sử dụng các công cụ như mongoimport hoặc viết mã để tự động nhập dữ liệu từ file JSON vào cơ sở dữ liệu.

*Công nghệ sử dụng
Backend: Node.js, Express, Mongoose, JWT, bcrypt, multer, dotenv, cors
Frontend: Angular, RxJS, Bootstrap, FontAwesome, ngx-cookie-service, ngx-spinner

*Lỗi thường gặp
Không kết nối được MongoDB: Kiểm tra MONGO_URI trong file .env, đảm bảo MongoDB đang chạy.
Lỗi CORS: Dùng proxy.conf.json trong Angular hoặc bật middleware cors trong Express.
Git clone báo “file should have been a pointer”: Cài đặt Git LFS bằng lệnh git lfs install trước khi clone repo.
Thiếu phụ thuộc khi chạy ng serve: Vào thư mục frontend, chạy npm install để cài lại gói.

Liên hệ
Hy vọng bạn sẽ thành công khi triển khai dự án này. Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ qua hotline: 0792 098 510.
Chúc bạn làm việc hiệu quả!
