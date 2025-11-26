import { useState, useEffect } from 'react';
import { Edit2, Users, TrendingUp, Package, DollarSign, Eye, X, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { apiRequest, formatPrice, formatDate } from '../../lib/api';

/**
 * CreditPackageManagement - Admin component to manage credit packages
 * Features:
 * - View all packages with statistics
 * - Edit package details (name, price, credits, description, status)
 * - View purchase history per package
 * - View overall statistics
 */
export const CreditPackageManagement = () => {
  const { show: showToast } = useToast();
  const [packages, setPackages] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [viewingPurchases, setViewingPurchases] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [formData, setFormData] = useState({
    credits: '',
    price: '',
    packageName: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [packagesData, statsData] = await Promise.all([
        apiRequest('/api/admin/credit-packages'),
        apiRequest('/api/admin/credit-packages/statistics')
      ]);
      setPackages(packagesData || []);
      setStatistics(statsData || null);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast({
        title: 'Lỗi tải dữ liệu',
        description: error.message || 'Không thể tải danh sách gói credit',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async (feeId, page = 1) => {
    try {
      setPurchasesLoading(true);
      const response = await apiRequest(`/api/admin/credit-packages/${feeId}/purchases?page=${page}&pageSize=20`);
      setPurchases(response.purchases || []);
      setPurchasesTotal(response.totalRecords || 0);
      setPurchasePage(page);
    } catch (error) {
      console.error('Error loading purchases:', error);
      showToast({
        title: 'Lỗi',
        description: 'Không thể tải lịch sử mua hàng',
        type: 'error'
      });
    } finally {
      setPurchasesLoading(false);
    }
  };

  const handleUpdate = async (feeId) => {
    try {
      console.log('🔄 Starting update for feeId:', feeId);
      console.log('📝 Form data:', formData);
      
      // Validate - CHỈ CHECK TÊN GÓI (credits và price không thể sửa)
      if (!formData.packageName || formData.packageName.trim() === '') {
        console.log('❌ Validation failed: Missing package name');
        showToast({
          title: 'Thiếu thông tin',
          description: 'Vui lòng nhập tên gói',
          type: 'warning'
        });
        return;
      }

      // ⚠️ KHÔNG GỬI credits và price để tránh thay đổi giá trị quan trọng
      const requestBody = {
        packageName: formData.packageName,
        description: formData.description,
        isActive: formData.isActive
      };
      
      console.log('📤 Sending PUT request to:', `/api/admin/credit-packages/${feeId}`);
      console.log('📦 Request body (chỉ tên, mô tả, trạng thái):', requestBody);

      const updated = await apiRequest(`/api/admin/credit-packages/${feeId}`, {
        method: 'PUT',
        body: requestBody
      });
      
      console.log('✅ Update response:', updated);

      console.log('🔄 Updating local state...');
      setPackages(packages.map(p => p.feeId === feeId ? updated : p));
      setEditingId(null);
      resetForm();
      
      console.log('✅ Update completed successfully');
      showToast({
        title: 'Thành công',
        description: 'Đã cập nhật gói credit',
        type: 'success'
      });

      // Reload statistics
      console.log('🔄 Reloading data...');
      loadData();
    } catch (error) {
      console.error('❌ Error updating package:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response,
        status: error.status
      });
      showToast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật gói credit',
        type: 'error'
      });
    }
  };

  const startEdit = (pkg) => {
    setEditingId(pkg.feeId);
    setFormData({
      credits: pkg.credits.toString(),
      price: pkg.price.toString(),
      packageName: pkg.packageName || '',
      description: pkg.description || '',
      isActive: pkg.isActive
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      credits: '',
      price: '',
      packageName: '',
      description: '',
      isActive: true
    });
  };

  const openPurchaseHistory = (pkg) => {
    setViewingPurchases(pkg);
    loadPurchases(pkg.feeId, 1);
  };

  const closePurchaseHistory = () => {
    setViewingPurchases(null);
    setPurchases([]);
    setPurchasePage(1);
    setPurchasesTotal(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Gói Credit</h2>
        <p className="text-gray-600 mt-1">Quản lý các gói credit cho đăng tin</p>
      </div>

      {/* Overall Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={24} />
              <span className="text-blue-100 text-sm">Tổng doanh thu</span>
            </div>
            <p className="text-2xl font-bold">{formatPrice(statistics.totalRevenue)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Package size={24} />
              <span className="text-green-100 text-sm">Tổng gói đã bán</span>
            </div>
            <p className="text-2xl font-bold">{statistics.totalPackagesSold.toLocaleString()}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={24} />
              <span className="text-purple-100 text-sm">Tổng credits đã bán</span>
            </div>
            <p className="text-2xl font-bold">{statistics.totalCreditsSold.toLocaleString()}</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={24} />
              <span className="text-orange-100 text-sm">Giá trị TB/đơn</span>
            </div>
            <p className="text-2xl font-bold">{formatPrice(statistics.averageOrderValue)}</p>
          </div>
        </div>
      )}

      {/* Packages List */}
      <div className="grid gap-4">
        {packages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Chưa có gói credit nào</p>
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.feeId}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              {editingId === pkg.feeId ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên gói *
                      </label>
                      <input
                        type="text"
                        value={formData.packageName}
                        onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: Gói Phổ Biến"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượt đăng *
                      </label>
                      <input
                        type="number"
                        value={formData.credits}
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 10"
                        title="Không thể sửa số lượt để đảm bảo tính nhất quán về giá"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá (VND) *
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        disabled={true}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        placeholder="VD: 85000"
                        title="Không thể sửa giá để đảm bảo công bằng cho người đã mua"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <select
                        value={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="true">Kích hoạt</option>
                        <option value="false">Ẩn</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        placeholder="VD: Tiết kiệm 15% - Phù hợp cho người dùng thường xuyên"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdate(pkg.feeId)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Check size={18} />
                      Lưu
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                    >
                      <X size={18} />
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {pkg.packageName || `Gói ${pkg.credits} lượt`}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        pkg.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {pkg.isActive ? 'Đang bán' : 'Đã ẩn'}
                      </span>
                    </div>
                    
                    <div className="flex items-baseline gap-3 mb-3">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatPrice(pkg.price)}
                      </p>
                      <span className="text-gray-600">
                        {pkg.credits} lượt đăng
                      </span>
                      <span className="text-sm text-gray-500">
                        ({formatPrice(pkg.pricePerCredit)}/lượt)
                      </span>
                    </div>
                    
                    {pkg.description && (
                      <p className="text-gray-600 mb-3">{pkg.description}</p>
                    )}
                    
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <span className="text-gray-600">
                          Đã bán: <span className="font-semibold text-gray-900">{pkg.totalSold}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-gray-400" />
                        <span className="text-gray-600">
                          Doanh thu: <span className="font-semibold text-gray-900">{formatPrice(pkg.totalRevenue)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => openPurchaseHistory(pkg)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Xem lịch sử mua"
                    >
                      <Users size={18} />
                    </button>
                    <button
                      onClick={() => startEdit(pkg)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Purchase History Modal */}
      {viewingPurchases && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Lịch sử mua: {viewingPurchases.packageName || `Gói ${viewingPurchases.credits} lượt`}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPrice(viewingPurchases.price)} - {viewingPurchases.credits} lượt đăng
                  </p>
                </div>
                <button
                  onClick={closePurchaseHistory}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {purchasesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Đang tải...</span>
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Chưa có ai mua gói này</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.paymentId}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">
                              {purchase.userName || 'N/A'}
                            </span>
                            <span className="text-sm text-gray-600">
                              {purchase.userEmail}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              Mã GD: <span className="font-mono">{purchase.transactionNo || 'N/A'}</span>
                            </span>
                            <span>
                              {formatDate(purchase.purchaseDate)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            {formatPrice(purchase.amount)}
                          </p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                            purchase.status === 'Success' 
                              ? 'bg-green-100 text-green-700'
                              : purchase.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {purchase.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer - Pagination */}
            {!purchasesLoading && purchases.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Tổng: {purchasesTotal} giao dịch
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadPurchases(viewingPurchases.feeId, purchasePage - 1)}
                      disabled={purchasePage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600">
                      Trang {purchasePage}
                    </span>
                    <button
                      onClick={() => loadPurchases(viewingPurchases.feeId, purchasePage + 1)}
                      disabled={purchases.length < 20}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
