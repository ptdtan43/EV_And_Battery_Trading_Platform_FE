import { Link } from 'react-router-dom';
import { Cookie, ArrowLeft } from 'lucide-react';

export default function Cookies() {
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
            <Cookie className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Chính sách Cookie</h1>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Cookie là gì?</h2>
              <p className="text-gray-700 leading-relaxed">
                Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập website. Cookie giúp website ghi nhớ thông tin về lượt truy cập của bạn, giúp trải nghiệm sử dụng thuận tiện và hiệu quả hơn.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Các loại cookie chúng tôi sử dụng</h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie cần thiết</h3>
                  <p className="text-gray-700">
                    Những cookie này là bắt buộc để website hoạt động và không thể tắt trong hệ thống của chúng tôi. Chúng thường chỉ được thiết lập để đáp ứng các hành động của bạn như đăng nhập, điền form, hoặc thiết lập quyền riêng tư.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie hiệu suất</h3>
                  <p className="text-gray-700">
                    Cookie này cho phép chúng tôi đếm lượt truy cập và nguồn lưu lượng để đo lường và cải thiện hiệu suất của website. Chúng giúp chúng tôi biết trang nào phổ biến nhất và ít phổ biến nhất, và xem người dùng di chuyển trên website như thế nào.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie chức năng</h3>
                  <p className="text-gray-700">
                    Cookie này cho phép website cung cấp chức năng nâng cao và cá nhân hóa. Chúng có thể được thiết lập bởi chúng tôi hoặc bởi các nhà cung cấp bên thứ ba mà chúng tôi đã thêm dịch vụ của họ vào trang.
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie quảng cáo</h3>
                  <p className="text-gray-700">
                    Cookie này có thể được thiết lập thông qua website của chúng tôi bởi các đối tác quảng cáo. Chúng có thể được các công ty đó sử dụng để xây dựng hồ sơ về sở thích của bạn và hiển thị quảng cáo phù hợp trên các website khác.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Mục đích sử dụng cookie</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Chúng tôi sử dụng cookie để:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Duy trì phiên đăng nhập của bạn</li>
                <li>Ghi nhớ các tùy chọn và cài đặt của bạn</li>
                <li>Cải thiện tốc độ và bảo mật của website</li>
                <li>Phân tích cách người dùng sử dụng website</li>
                <li>Cá nhân hóa nội dung và quảng cáo</li>
                <li>Đo lường hiệu quả của các chiến dịch marketing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cookie của bên thứ ba</h2>
              <p className="text-gray-700 leading-relaxed">
                Ngoài cookie của chúng tôi, chúng tôi cũng sử dụng cookie của các bên thứ ba như Google Analytics, Facebook Pixel, và các dịch vụ phân tích khác để hiểu rõ hơn về cách người dùng tương tác với website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Quản lý cookie</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Bạn có thể kiểm soát và/hoặc xóa cookie theo ý muốn. Bạn có thể:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Xóa tất cả cookie đã được lưu trên thiết bị của bạn</li>
                <li>Thiết lập trình duyệt để chặn cookie</li>
                <li>Thiết lập trình duyệt để cảnh báo khi có cookie được gửi</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Lưu ý: Nếu bạn chặn hoặc xóa cookie, một số tính năng của website có thể không hoạt động đúng cách.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cách tắt cookie trên các trình duyệt phổ biến</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>Google Chrome:</strong> Settings → Privacy and security → Cookies and other site data</p>
                <p><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</p>
                <p><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</p>
                <p><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Thời gian lưu trữ cookie</h2>
              <p className="text-gray-700 leading-relaxed">
                Thời gian lưu trữ cookie phụ thuộc vào loại cookie. Cookie phiên (session cookies) sẽ bị xóa khi bạn đóng trình duyệt. Cookie lâu dài (persistent cookies) sẽ được lưu trữ trong khoảng thời gian từ vài ngày đến vài năm tùy thuộc vào mục đích sử dụng.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cập nhật chính sách</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi có thể cập nhật chính sách cookie này theo thời gian để phản ánh các thay đổi trong cách chúng tôi sử dụng cookie hoặc vì lý do pháp lý, quy định. Vui lòng kiểm tra trang này thường xuyên để cập nhật thông tin mới nhất.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Liên hệ</h2>
              <p className="text-gray-700 leading-relaxed">
                Nếu bạn có câu hỏi về chính sách cookie của chúng tôi, vui lòng liên hệ:
              </p>
              <p className="text-gray-700 mt-2">
                Email: support@evmarket.vn<br />
                Điện thoại: +84 123 456 789
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
