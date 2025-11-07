/*
  Script: generate-doc.cjs
  Purpose: Generate a .docx file summarizing Payment, Admin UI, and Rating flows (CommonJS)
*/

const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType
} = require('docx');

function heading(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
}

function subHeading(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2 });
}

function p(text) {
  return new Paragraph({ children: [new TextRun(text)] });
}

function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 } });
}

function numbered(text) {
  return new Paragraph({ text, numbering: { reference: 'num-steps', level: 0 } });
}

async function main() {
  const sections = [];

  // Title
  sections.push({
    properties: {},
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'EV Trading Platform - Luồng Hệ Thống', bold: true, size: 36 }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: 'Thanh toán · Giao diện Admin · Đánh giá', alignment: AlignmentType.CENTER }),
      new Paragraph({ text: '' }),
    ],
  });

  // PAYMENT FLOW
  const paymentChildren = [];
  paymentChildren.push(heading('1) Luồng Thanh Toán (VNPay)'));
  paymentChildren.push(subHeading('Mục tiêu'));
  paymentChildren.push(p('Cho phép người dùng thanh toán cọc/tổng tiền qua VNPay, lưu giao dịch và trạng thái.'));

  paymentChildren.push(subHeading('Tổng quan kiến trúc'));
  paymentChildren.push(bullet('Frontend tạo Order trước, sau đó gọi API tạo Payment và redirect sang VNPay.'));
  paymentChildren.push(bullet('Backend xác thực người dùng, sinh PaymentId, tạo VNPay URL, lưu bản ghi Payment.'));
  paymentChildren.push(bullet('Khi VNPay callback, backend cập nhật trạng thái Payment/Order tương ứng.'));

  paymentChildren.push(subHeading('Các endpoint chính (Backend)'));
  paymentChildren.push(bullet('POST /api/Order - Tạo order mới'));
  paymentChildren.push(bullet('POST /api/Payment - Tạo payment request, trả về paymentUrl'));
  paymentChildren.push(bullet('GET  /api/Payment/callback - Xử lý callback từ VNPay'));

  paymentChildren.push(subHeading('Luồng chi tiết (từng bước)'));
  paymentChildren.push(numbered('Người dùng chọn sản phẩm và bấm Thanh toán.'));
  paymentChildren.push(numbered('Frontend gọi POST /api/Order để tạo đơn (OrderId).'));
  paymentChildren.push(numbered('Frontend gọi POST /api/Payment kèm OrderId, Amount, PaymentType.'));
  paymentChildren.push(numbered('Backend: kiểm tra JWT, kiểm tra Order thuộc user, tính Payout (95%), tạo PaymentId.'));
  paymentChildren.push(numbered('Backend: tạo VNPay URL, lưu Payment với trạng thái "Pending" và trả paymentUrl.'));
  paymentChildren.push(numbered('Frontend: redirect người dùng sang VNPay qua paymentUrl.'));
  paymentChildren.push(numbered('VNPay gọi callback về backend → cập nhật PaymentStatus và OrderStatus.'));

  paymentChildren.push(subHeading('Code tham chiếu (rút gọn)'));
  paymentChildren.push(p('Backend: backend/Controllers/PaymentController.cs - CreatePayment()'));
  paymentChildren.push(p('Frontend: src/services/paymentService.js - processVNPayPayment()'));
  paymentChildren.push(p('Tài liệu: PAYMENT_FIX_README.md - mô tả flow và endpoints'));

  sections.push({ properties: {}, children: paymentChildren });

  // ADMIN UI FLOW
  const adminChildren = [];
  adminChildren.push(heading('2) Giao Diện Quản Trị (AdminDashboard)'));
  adminChildren.push(subHeading('Mục tiêu'));
  adminChildren.push(p('Cung cấp trang tổng quan quản trị: thống kê, duyệt bài đăng, báo cáo, thông báo.'));

  adminChildren.push(subHeading('Các phần chính'));
  adminChildren.push(bullet('Thống kê: người dùng, bài đăng, đơn hàng, doanh thu (hôm nay/tháng/năm).'));
  adminChildren.push(bullet('Quản lý bài đăng: lọc, tìm kiếm, xem chi tiết, duyệt/ từ chối.'));
  adminChildren.push(bullet('Thông báo: gửi thông báo khi duyệt hoặc từ chối.'));
  adminChildren.push(bullet('Báo cáo: tab Reports hiển thị biểu đồ và số liệu.'));

  adminChildren.push(subHeading('Luồng dữ liệu (từng bước)'));
  adminChildren.push(numbered('Khi mở trang, React gọi nhiều API: /api/User, /api/Product, v.v...'));
  adminChildren.push(numbered('Dữ liệu được cache cục bộ (localStorage) khi API lỗi để tăng ổn định.'));
  adminChildren.push(numbered('Danh sách bài đăng được lọc theo trạng thái, loại (vehicle/battery), ngày, và từ khóa.'));
  adminChildren.push(numbered('Admin mở chi tiết, xem ảnh, lịch sử; bấm Approve hoặc Reject.'));
  adminChildren.push(numbered('Hệ thống gọi API duyệt/từ chối và gửi notification đến người đăng.'));

  adminChildren.push(subHeading('Code tham chiếu (rút gọn)'));
  adminChildren.push(p('Frontend: src/pages/AdminDashboard.jsx - thành phần chính, tabs, loadAdminData()'));
  adminChildren.push(p('Frontend: src/components/admin/RejectProductModal.jsx - modal từ chối'));
  adminChildren.push(p('Frontend: src/lib/notificationApi.js - gửi thông báo duyệt/từ chối'));

  sections.push({ properties: {}, children: adminChildren });

  // RATING FLOW
  const ratingChildren = [];
  ratingChildren.push(heading('3) Luồng Đánh Giá (Rating/Review)'));
  ratingChildren.push(subHeading('Mục tiêu'));
  ratingChildren.push(p('Cho phép người mua đã hoàn tất đơn hàng đánh giá sản phẩm/người bán.'));

  ratingChildren.push(subHeading('Quy tắc nghiệp vụ'));
  ratingChildren.push(bullet('Chỉ người mua của đơn hàng đã hoàn tất (OrderStatus = completed) mới được đánh giá.'));
  ratingChildren.push(bullet('Mỗi Order chỉ được đánh giá một lần.'));

  ratingChildren.push(subHeading('Luồng chi tiết (từng bước)'));
  ratingChildren.push(numbered('Người mua mở trang lịch sử/chi tiết đơn hàng đã hoàn tất.'));
  ratingChildren.push(numbered('Nhập điểm (1-5) và nhận xét, bấm Gửi đánh giá.'));
  ratingChildren.push(numbered('Frontend gọi POST /api/Rating kèm OrderId, ProductId, SellerId, RatingValue, Comment.'));
  ratingChildren.push(numbered('Backend kiểm tra JWT, xác minh đơn hàng thuộc user, trạng thái completed, và chưa có đánh giá.'));
  ratingChildren.push(numbered('Backend lưu Rating và trả về thông tin đánh giá vừa tạo.'));

  ratingChildren.push(subHeading('Code tham chiếu (rút gọn)'));
  ratingChildren.push(p('Backend: backend/Controllers/RatingController.cs - CreateRating() (kiểm tra quyền và điều kiện)'));
  ratingChildren.push(p('Backend: backend/Controllers/SimpleRatingController.cs - mock endpoints để test nhanh'));
  ratingChildren.push(p('Frontend: src/components/common/RatingSystem.jsx (nếu có), hoặc form rating trong trang chi tiết'));

  sections.push({ properties: {}, children: ratingChildren });

  // Simple table with endpoints
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [p('Tính năng')]}),
          new TableCell({ children: [p('Endpoint/Thành phần chính')]}),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [p('Thanh toán')]}),
          new TableCell({ children: [p('POST /api/Order, POST /api/Payment, GET /api/Payment/callback')]}),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [p('Admin UI')]}),
          new TableCell({ children: [p('src/pages/AdminDashboard.jsx, notificationApi.js')]}),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [p('Đánh giá')]}),
          new TableCell({ children: [p('POST /api/Rating, GET /api/Rating/product/{id}, GET /api/Rating/seller/{id}')]}),
        ],
      }),
    ],
  });

  sections.push({ properties: {}, children: [subHeading('Tổng hợp nhanh'), table] });

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'num-steps',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections,
  });

  const outDir = path.resolve(process.cwd(), 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'ThuyetTrinh_Luong_HeThong.docx');

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Đã tạo file: ${outPath}`);
}

main().catch((err) => {
  console.error('Failed to generate docx:', err);
  process.exit(1);
});







