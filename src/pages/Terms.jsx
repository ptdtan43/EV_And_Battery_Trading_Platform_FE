import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function Terms() {
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
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Điều khoản sử dụng</h1>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Chấp nhận điều khoản</h2>
              <p className="text-gray-700 leading-relaxed">
                Bằng việc truy cập và sử dụng nền tảng EV Market, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Tài khoản người dùng</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Khi đăng ký tài khoản trên EV Market, bạn cam kết:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Cung cấp thông tin chính xác, đầy đủ và cập nhật</li>
                <li>Bảo mật thông tin đăng nhập của bạn</li>
                <li>Chịu trách nhiệm về mọi hoạt động diễn ra dưới tài khoản của bạn</li>
                <li>Thông báo ngay cho chúng tôi nếu phát hiện bất kỳ vi phạm bảo mật nào</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Quy định giao dịch</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Người bán và người mua trên nền tảng phải tuân thủ:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Mô tả sản phẩm chính xác, trung thực</li>
                <li>Không đăng bán hàng giả, hàng nhái, hàng cấm</li>
                <li>Thực hiện giao dịch đúng cam kết</li>
                <li>Giải quyết tranh chấp một cách thiện chí</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Thanh toán và phí dịch vụ</h2>
              <p className="text-gray-700 leading-relaxed">
                EV Market thu phí dịch vụ cho các giao dịch thành công trên nền tảng. Chi tiết về phí dịch vụ sẽ được thông báo rõ ràng trước khi bạn hoàn tất giao dịch. Mọi khoản thanh toán đều được xử lý qua cổng thanh toán an toàn.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Quyền sở hữu trí tuệ</h2>
              <p className="text-gray-700 leading-relaxed">
                Tất cả nội dung trên EV Market, bao gồm văn bản, hình ảnh, logo, và phần mềm, đều thuộc quyền sở hữu của EV Market hoặc các bên cấp phép. Bạn không được sao chép, phân phối hoặc sử dụng nội dung này mà không có sự cho phép bằng văn bản.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Giới hạn trách nhiệm</h2>
              <p className="text-gray-700 leading-relaxed">
                EV Market đóng vai trò là nền tảng kết nối người mua và người bán. Chúng tôi không chịu trách nhiệm về chất lượng sản phẩm, tính chính xác của thông tin do người bán cung cấp, hoặc các tranh chấp phát sinh giữa các bên giao dịch.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Thay đổi điều khoản</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi có quyền cập nhật các điều khoản này bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Liên hệ</h2>
              <p className="text-gray-700 leading-relaxed">
                Nếu bạn có bất kỳ câu hỏi nào về các điều khoản này, vui lòng liên hệ với chúng tôi qua email: support@evmarket.vn
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
