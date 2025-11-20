import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại trang chủ
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Chính sách bảo mật</h1>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Thông tin chúng tôi thu thập</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Khi bạn sử dụng EV Market, chúng tôi có thể thu thập các loại thông tin sau:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Thông tin cá nhân: họ tên, email, số điện thoại, địa chỉ</li>
                <li>Thông tin tài khoản: tên đăng nhập, mật khẩu (được mã hóa)</li>
                <li>Thông tin giao dịch: lịch sử mua bán, thanh toán</li>
                <li>Thông tin thiết bị: địa chỉ IP, loại trình duyệt, hệ điều hành</li>
                <li>Dữ liệu sử dụng: các trang bạn truy cập, thời gian sử dụng</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Cách chúng tôi sử dụng thông tin</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Thông tin của bạn được sử dụng để:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Cung cấp và cải thiện dịch vụ của chúng tôi</li>
                <li>Xử lý giao dịch và thanh toán</li>
                <li>Gửi thông báo về đơn hàng, cập nhật dịch vụ</li>
                <li>Hỗ trợ khách hàng và giải quyết tranh chấp</li>
                <li>Phân tích và cải thiện trải nghiệm người dùng</li>
                <li>Phát hiện và ngăn chặn gian lận</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Chia sẻ thông tin</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn. Thông tin có thể được chia sẻ với:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-3">
                <li>Đối tác thanh toán để xử lý giao dịch</li>
                <li>Nhà cung cấp dịch vụ hỗ trợ vận hành nền tảng</li>
                <li>Cơ quan pháp luật khi có yêu cầu hợp pháp</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Bảo mật thông tin</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ thông tin của bạn khỏi truy cập trái phép, mất mát, hoặc tiết lộ. Tuy nhiên, không có phương thức truyền tải qua Internet nào là hoàn toàn an toàn 100%.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookie và công nghệ theo dõi</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi sử dụng cookie và các công nghệ tương tự để cải thiện trải nghiệm người dùng, phân tích lưu lượng truy cập, và cá nhân hóa nội dung. Bạn có thể quản lý cookie thông qua cài đặt trình duyệt của mình.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Quyền của bạn</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Bạn có quyền:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Truy cập và xem thông tin cá nhân của bạn</li>
                <li>Yêu cầu chỉnh sửa thông tin không chính xác</li>
                <li>Yêu cầu xóa tài khoản và dữ liệu cá nhân</li>
                <li>Từ chối nhận email marketing</li>
                <li>Rút lại sự đồng ý xử lý dữ liệu</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Lưu trữ dữ liệu</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi lưu trữ thông tin của bạn trong thời gian cần thiết để cung cấp dịch vụ và tuân thủ các nghĩa vụ pháp lý. Sau khi bạn xóa tài khoản, dữ liệu sẽ được xóa hoặc ẩn danh hóa trong vòng 90 ngày.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Thay đổi chính sách</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Các thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo trên nền tảng.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Liên hệ</h2>
              <p className="text-gray-700 leading-relaxed">
                Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn thực hiện quyền của mình, vui lòng liên hệ:
              </p>
              <p className="text-gray-700 mt-2">
                Email: privacy@evmarket.vn<br />
                Điện thoại: +84 123 456 789
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
