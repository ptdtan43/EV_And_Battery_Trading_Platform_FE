<<<<<<< HEAD
# EV Market - Nền tảng giao dịch xe điện & pin số 1 Việt Nam

## Giới thiệu

EV Market là một nền tảng web hoàn chỉnh cho việc mua bán xe điện và pin xe điện tại Việt Nam. Ứng dụng được xây dựng với React, Supabase, và Tailwind CSS, cung cấp trải nghiệm người dùng mượt mà và hiện đại.

## Tính năng

### Cho người dùng (Member)
- ✅ Đăng ký và đăng nhập với email/password
- ✅ Quản lý thông tin cá nhân
- ✅ Đăng tin bán xe điện và pin
- ✅ Xem danh sách sản phẩm với bộ lọc
- ✅ Theo dõi sản phẩm yêu thích (Wishlist)
- ✅ Dashboard cá nhân với thống kê
- ✅ Xem lịch sử giao dịch
- ✅ Đánh giá và review sản phẩm

### Cho quản trị viên (Admin)
- ✅ Dashboard tổng quan với thống kê
- ✅ Quản lý người dùng
- ✅ Kiểm duyệt tin đăng (approve/reject)
- ✅ Quản lý giao dịch
- ✅ Xem báo cáo doanh thu và hoa hồng

### Tính năng khác
- ✅ Responsive design (mobile-first)
- ✅ Authentication với Supabase Auth
- ✅ Row Level Security (RLS) cho database
- ✅ Upload và quản lý hình ảnh
- ✅ Tìm kiếm và lọc sản phẩm
- ✅ AI gợi ý giá (mock)

## Công nghệ sử dụng

- **Frontend**: React 18 (JavaScript)
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend & Database**: Supabase
  - Authentication
  - PostgreSQL Database
  - Row Level Security
- **Build Tool**: Vite

## Cài đặt

### Yêu cầu hệ thống
- Node.js >= 16.x
- npm >= 8.x

### Các bước cài đặt

1. Clone repository (hoặc giải nén source code)
```bash
cd ev-market
```

2. Cài đặt dependencies
```bash
npm install
```

3. Kiểm tra file `.env` đã có sẵn với thông tin Supabase:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Khởi động development server
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

## Seed dữ liệu mẫu

Để tạo dữ liệu mẫu cho ứng dụng:

1. Truy cập: `http://localhost:5173/seed`
2. Click nút "Seed Database"
3. Đợi quá trình hoàn tất

Sau khi seed, bạn sẽ có:
- 1 tài khoản Admin
- 5 tài khoản Member
- 8 tin đăng mẫu (xe điện và pin)

## Tài khoản đăng nhập

### Admin
- Email: `admin@evmarket.com`
- Password: `admin123`

### Member (ví dụ)
- Email: `nguyen.vana@email.com`
- Password: `member123`

*Tất cả các tài khoản member đều sử dụng password: `member123`*

## Cấu trúc thư mục

```
src/
├── components/
│   ├── auth/           # Components xác thực
│   ├── common/         # Components dùng chung
│   ├── layout/         # Header, Footer
│   ├── member/         # Components cho member
│   └── admin/          # Components cho admin
├── contexts/           # React Context (Auth)
├── lib/                # Supabase client
├── pages/              # Các trang chính
├── utils/              # Utilities, constants
└── App.jsx             # Main app với routing
```

## Database Schema

### Tables
- `profiles` - Thông tin người dùng
- `categories` - Danh mục sản phẩm
- `listings` - Tin đăng (xe điện, pin)
- `transactions` - Giao dịch
- `reviews` - Đánh giá
- `favorites` - Sản phẩm yêu thích
- `bids` - Đấu giá (cho tính năng mở rộng)

## Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

## Tính năng nổi bật

### 1. Authentication System
- Đăng ký/Đăng nhập với email và password
- Session management với Supabase Auth
- Protected routes cho member và admin
- Profile management

### 2. Product Listings
- Hiển thị danh sách xe điện và pin
- Lọc theo thương hiệu, giá, năm sản xuất
- Upload và quản lý hình ảnh
- Status management (pending, approved, rejected, sold)

### 3. Admin Dashboard
- Thống kê tổng quan
- Kiểm duyệt tin đăng
- Quản lý người dùng
- Theo dõi giao dịch và doanh thu

### 4. Member Dashboard
- Xem thống kê cá nhân
- Quản lý tin đăng của mình
- Cập nhật thông tin cá nhân
- Xem lịch sử giao dịch

### 5. Security
- Row Level Security (RLS) trên tất cả tables
- Authentication required cho các trang quan trọng
- Admin-only routes
- Secure data access policies

## Responsive Design

Ứng dụng được thiết kế responsive cho các kích thước màn hình:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Best Practices

1. **Component Organization**: Mỗi component có một trách nhiệm rõ ràng
2. **Code Comments**: Không có comments không cần thiết (code tự giải thích)
3. **Error Handling**: Xử lý lỗi đầy đủ với try-catch
4. **Loading States**: Hiển thị loading state cho tất cả async operations
5. **Security**: RLS policies cho mọi table trong database

## Troubleshooting

### Lỗi khi build
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
npm install
```

### Lỗi kết nối Supabase
- Kiểm tra file `.env` có đúng URL và key không
- Kiểm tra internet connection

### Lỗi authentication
- Xóa local storage và thử đăng nhập lại
- Kiểm tra Supabase Auth settings

## Mở rộng trong tương lai

- [ ] Tích hợp payment gateway thực tế (Stripe, VNPay)
- [ ] Hệ thống chat real-time giữa buyer và seller
- [ ] Notification system
- [ ] Email verification
- [ ] Social login (Google, Facebook)
- [ ] Advanced search với Elasticsearch
- [ ] Mobile app (React Native)
- [ ] AI price suggestion (thực tế)
- [ ] Video tours cho xe

## License

Dự án này được tạo ra cho mục đích học tập và demo.

## Hỗ trợ

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ qua email hoặc tạo issue.

---

**Developed with ❤️ for EV Market Vietnam**
=======
# SWP391_Topic2_Frontend_ver2
SWP391_Topic2_Frontend_ver2
>>>>>>> 271beeb6f371ab15d1813af9cc1c517a6209f200
