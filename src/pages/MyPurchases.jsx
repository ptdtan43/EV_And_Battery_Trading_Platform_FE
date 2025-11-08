import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Package, Star, CheckCircle, Eye, MessageSquare, XCircle, AlertCircle, ShoppingCart, Store } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { batchFetchProductImages, fetchProductImages, preloadImage } from '../utils/imageLoader';

const MyPurchases = () => {
  const { user } = useAuth();
  const { show } = useToast();
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'sales'
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]); // For seller's sold products
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (user) {
      loadPurchases();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'sales') {
      loadSales();
    }
  }, [user, activeTab]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.userId || user?.accountId;
      
        // Get buyer orders with full product information
        console.log('🔍 Making API request to /api/Order/buyer (with product details)');
        let orders = await apiRequest(`/api/Order/buyer`);
      console.log('🔍 Raw API response:', orders);
      
      // Debug orders data
      console.log('🔍 Orders from API:', orders);
      console.log('🔍 First order structure:', orders[0]);
      console.log('🔍 All order fields:', orders[0] ? Object.keys(orders[0]) : 'No orders');
      console.log('🔍 Sample order data:', JSON.stringify(orders[0], null, 2));
      
      // Check if this API returns different structure
      if (orders && orders.length > 0) {
        const firstOrder = orders[0];
        console.log('🔍 First order productId:', firstOrder.productId);
        console.log('🔍 First order has product field:', !!firstOrder.product);
        if (firstOrder.product) {
          console.log('🔍 First order product:', firstOrder.product);
        }
      }
      
      // Check if orders is an array and has data
      if (!Array.isArray(orders)) {
        console.error('❌ Orders is not an array:', typeof orders, orders);
        
        // Check if orders might be wrapped in another object
        if (orders && typeof orders === 'object') {
          console.log('🔍 Checking if orders is wrapped in another object...');
          console.log('🔍 Orders keys:', Object.keys(orders));
          
          // Check common wrapper patterns
          if (orders.data && Array.isArray(orders.data)) {
            console.log('✅ Found orders in orders.data');
            orders = orders.data;
          } else if (orders.items && Array.isArray(orders.items)) {
            console.log('✅ Found orders in orders.items');
            orders = orders.items;
          } else if (orders.results && Array.isArray(orders.results)) {
            console.log('✅ Found orders in orders.results');
            orders = orders.results;
          } else {
            console.error('❌ No array found in common wrapper patterns');
            return;
          }
        } else {
          return;
        }
      }
      
      if (orders.length === 0) {
        console.log('ℹ️ No orders returned from API');
        return;
      }
      
      // Check ALL orders for detailed analysis
      console.log(`🔍 Analyzing all ${orders.length} orders:`);
      orders.forEach((order, index) => {
        console.log(`🔍 Order ${index} (ID: ${order.orderId}):`, {
          orderStatus: order.status,
          productStatus: order.product?.status,
          productTitle: order.product?.title,
          productId: order.product?.productId,
          hasProduct: !!order.product
        });
      });
      
      // Filter to show orders that buyer has deposited, completed, or rejected
      // Logic: "Đơn mua" quản lý các đơn hàng đã đặt cọc để buyer theo dõi
      // Khi admin xét duyệt: thành công → "đã mua", từ chối → "đã bị từ chối"
      const buyerOrders = orders.filter(order => {
        const orderStatus = (order.status || order.Status || order.orderStatus || order.OrderStatus || '').toLowerCase();
        const depositStatus = (order.depositStatus || order.DepositStatus || '').toLowerCase();
        const productStatus = (order.product?.status || order.product?.Status || '').toLowerCase();
        
        console.log(`🔍 Order ${order.orderId || order.OrderId} - Order status: ${orderStatus}, Deposit status: ${depositStatus}, Product status: ${productStatus}`);
        
        // Check if this order has valid productId
        // Backend returns: Product.ProductId (camelCase: product.productId)
        const productId = order.product?.productId || order.product?.ProductId || order.product?.id || order.productId || order.ProductId;
        const hasValidProductId = productId && productId !== null && productId !== undefined;
        
        if (!hasValidProductId) {
          console.log(`❌ Order ${order.orderId || order.OrderId} has invalid productId: ${productId}`);
          return false;
        }
        
        // Check if this order belongs to current user
        // Backend returns: BuyerId (camelCase: buyerId)
        const orderBuyerId = order.buyerId || order.BuyerId || order.userId || order.UserId;
        const isCurrentUserOrder = orderBuyerId == userId || orderBuyerId === userId || parseInt(orderBuyerId) === parseInt(userId);
        
        if (!isCurrentUserOrder) {
          return false;
        }
        
        // Show orders that are pending (buyer đang trong quá trình đặt cọc - chưa thanh toán cọc)
        // Backend returns: DepositStatus = "Unpaid" for unpaid deposits
        // NOTE: Order status may still be "Pending" even after successful deposit payment
        const isPending = orderStatus === 'pending' && 
                         (depositStatus === 'pending' || depositStatus === 'unpaid' || depositStatus === '' || !depositStatus);
        
        // Show orders that have been successfully deposited (đã đặt cọc thành công)
        // Backend PaymentController updates after successful deposit payment:
        // - Order.Status = "Deposited"
        // - Order.DepositStatus = "Paid"
        // - Product.Status = "Reserved"
        const productIsReserved = productStatus === 'reserved';
        const isDeposited = orderStatus === 'deposited' || 
                           orderStatus === 'depositpaid' || 
                           orderStatus === 'deposit_paid' ||
                           depositStatus === 'paid' ||
                           depositStatus === 'succeeded' ||
                           productIsReserved; // ✅ Fallback: Nếu product đã Reserved thì đã đặt cọc thành công
        
        // Show completed orders (admin confirmed success - đã mua thành công)
        const isCompleted = orderStatus === 'completed' || 
                           productStatus === 'sold' || 
                           productStatus === 'completed';
        
        // Show cancelled/rejected orders (admin rejected - đã bị từ chối)
        // Buyer cần biết lý do từ chối để theo dõi
        const isRejected = orderStatus === 'cancelled' || 
                          orderStatus === 'failed' ||
                          orderStatus === 'rejected';
        
        // Include if: has valid productId AND (is pending OR is deposited OR is completed OR is rejected)
        // Hiển thị cả pending orders (đang đặt cọc) và rejected orders (để buyer biết lý do từ chối)
        const shouldInclude = hasValidProductId && isCurrentUserOrder && (isPending || isDeposited || isCompleted || isRejected);
        
        if (shouldInclude) {
          console.log(`✅ Including order ${order.orderId || order.OrderId} - Order: ${orderStatus}, Deposit: ${depositStatus}, Product: ${productStatus}, ProductReserved: ${productIsReserved}, Pending: ${isPending}, Deposited: ${isDeposited}, Completed: ${isCompleted}, Rejected: ${isRejected}`);
        } else {
          console.log(`❌ Excluding order ${order.orderId || order.OrderId} - Order: ${orderStatus}, Deposit: ${depositStatus}, Product: ${productStatus}, ProductReserved: ${productIsReserved}`);
        }
        
        return shouldInclude;
      });
      
      console.log(`🔍 Total orders: ${orders.length}, Buyer orders (pending/deposited/completed/rejected): ${buyerOrders.length}`);
      console.log(`🔍 Buyer orders details:`, buyerOrders.map(o => ({
        orderId: o.orderId || o.OrderId,
        orderStatus: o.status || o.Status || o.orderStatus || o.OrderStatus,
        depositStatus: o.depositStatus || o.DepositStatus,
        productStatus: o.product?.status || o.product?.Status,
        productTitle: o.product?.title || o.product?.Title
      })));
      
      // Process orders - pending, deposited, completed, and rejected ones
      console.log(`🔍 About to process ${buyerOrders.length} buyer orders (pending/deposited/completed/rejected)`);
      
      // Fetch images for all products first
      const purchasesWithDetails = await Promise.all(buyerOrders.map(async (order, index) => {
        console.log(`🔍 Processing completed order ${index} (OrderId: ${order.orderId}):`, order);
        
        // Check if product data is already included
        if (order.product) {
          console.log(`✅ Order ${index} already has product data:`, order.product);
          
          // Extract productId from the product object
          const productId = order.product?.productId || order.product?.id || order.productId || order.product?.ProductId;
          
          // Skip orders with invalid product data
          if (!productId || productId === null) {
            console.log(`⚠️ Order ${order.orderId} has invalid productId (${productId}), skipping`);
            return null;
          }
          
          // Fetch product details to get latest status (important for completed orders)
          let productDetails = null;
          try {
            productDetails = await apiRequest(`/api/Product/${productId}`, 'GET');
            console.log(`✅ Fetched product ${productId} details for buyer order:`, productDetails);
          } catch (error) {
            console.log(`⚠️ Failed to fetch product ${productId} details:`, error.message);
            // Continue with existing product data if fetch fails
          }
          
          // Fetch images for this product
          let productImages = [];
          if (productId) {
            try {
              console.log(`🖼️ Fetching images for product ${productId}...`);
              const imageResponse = await apiRequest(`/api/ProductImage/product/${productId}`, 'GET');
              productImages = imageResponse || [];
              console.log(`🖼️ Product ${productId} images:`, productImages);
            } catch (error) {
              console.log(`❌ Failed to fetch images for product ${productId}:`, error.message);
              productImages = [];
            }
          }
          
          // Merge product data: prefer fetched productDetails, fallback to order.product
          const productWithImages = productDetails ? {
            ...order.product,
            ...productDetails,
            status: productDetails.status || productDetails.Status || order.product?.status || order.product?.Status,
            images: productImages,
            primaryImage: productImages?.[0] || null
          } : {
            ...order.product,
            images: productImages,
            primaryImage: productImages?.[0] || null
          };
            
          return {
            ...order,
            productId: productId,
            product: productWithImages,
            sellerId: (() => {
              const sellerId = order.sellerId || order.seller?.id || order.product?.sellerId || 1;
              return sellerId;
            })(),
            canReview: !order.hasRating && (order.status || order.orderStatus || '').toLowerCase() !== 'cancelled',
            orderStatus: order.status || order.orderStatus || order.product?.status || 'completed',
            cancellationReason: order.cancellationReason || order.CancellationReason || null
          };
        }
        
        // Fallback: try to find productId in various field names
        const productId = order.productId || order.product_id || order.ProductId || order.Product_ID || 
                         order.itemId || order.item_id;
        
        if (!productId) {
          console.error(`❌ Order ${index} has no product data or productId:`, order);
          return {
            ...order,
            productId: null,
            product: null,
            canReview: false,
            error: 'No product data found',
            orderStatus: order.status || order.orderStatus || 'Unknown'
          };
        }
        
        console.log(`✅ Found productId: ${productId} for order ${index}`);
        
        // Fetch product details to get latest status
        let productDetails = null;
        try {
          productDetails = await apiRequest(`/api/Product/${productId}`, 'GET');
          console.log(`✅ Fetched product ${productId} details:`, productDetails);
        } catch (error) {
          console.log(`⚠️ Failed to fetch product ${productId} details:`, error.message);
        }
        
        // Fetch images for this product
        let productImages = [];
        try {
          console.log(`🖼️ Fetching images for product ${productId}...`);
          const imageResponse = await apiRequest(`/api/ProductImage/product/${productId}`, 'GET');
          productImages = imageResponse || [];
          console.log(`🖼️ Product ${productId} images:`, productImages);
        } catch (error) {
          console.log(`❌ Failed to fetch images for product ${productId}:`, error.message);
          productImages = [];
        }
        
        return {
          ...order,
          productId: productId,
          product: productDetails ? {
            ...productDetails,
            images: productImages,
            primaryImage: productImages?.[0] || null
          } : {
            productId: productId,
            images: productImages,
            primaryImage: productImages?.[0] || null
          },
          sellerId: (() => {
            const sellerId = order.sellerId || order.seller?.id || order.product?.sellerId || 1;
            return sellerId;
          })(),
          canReview: !order.hasRating && (order.status || order.orderStatus || '').toLowerCase() !== 'cancelled',
          orderStatus: order.status || order.orderStatus || order.product?.status || 'completed',
          cancellationReason: order.cancellationReason || order.CancellationReason || null
        };
      });
      
      // Filter out null values (orders with invalid productId)
      const validPurchases = purchasesWithDetails.filter(purchase => purchase !== null);
      
      console.log(`🔍 Final purchases count: ${validPurchases.length}`);
      console.log(`🔍 Final purchases details:`, validPurchases.map(p => ({
        orderId: p.orderId,
        productTitle: p.product?.title,
        productId: p.productId,
        hasProduct: !!p.product,
        canReview: p.canReview
      })));
      
      setPurchases(validPurchases);
    } catch (error) {
      console.error('Error loading purchases:', error);
      show({
        title: 'Lỗi',
        description: 'Không thể tải danh sách đơn mua',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load seller's sales (orders where user is seller)
  const loadSales = async () => {
    try {
      setSalesLoading(true);
      const sellerId = user?.id || user?.userId || user?.accountId;
      
      console.log('🔍 Loading sales for seller:', sellerId);
      
      // ✅ FIX: Load sold products directly from Product API, not just from orders
      // This ensures we get all sold products even if orders are missing or incomplete
      const productsData = await apiRequest(`/api/Product/seller/${sellerId}`);
      const allProducts = Array.isArray(productsData) ? productsData : productsData?.items || [];
      
      // Filter sold products
      const soldProducts = allProducts.filter(product => {
        const status = (product.status || product.Status || '').toLowerCase();
        return status === 'sold';
      });
      
      console.log(`✅ Found ${soldProducts.length} sold products from Product API`);
      
      // Fetch seller orders from Order API
      let sellerOrders = [];
      try {
        sellerOrders = await apiRequest(`/api/Order/seller`);
        if (!Array.isArray(sellerOrders)) {
          sellerOrders = sellerOrders?.items || sellerOrders?.data || [];
        }
        console.log(`✅ Found ${sellerOrders.length} seller orders from Order API`);
      } catch (error) {
        console.log(`⚠️ Failed to fetch seller orders:`, error.message);
        sellerOrders = [];
      }
      
      // Filter to show ALL seller orders (deposited, completed, rejected)
      // Logic: "Đơn bán" quản lý các đơn hàng mà seller đã đăng sản phẩm
      // Khi buyer đặt cọc → "đã được đặt cọc"
      // Khi admin xét duyệt: thành công → "đã bán", từ chối → "đã bị từ chối"
      const sellerOrdersFiltered = sellerOrders.filter(order => {
        const orderStatus = (order.status || order.Status || order.orderStatus || order.OrderStatus || '').toLowerCase();
        const depositStatus = (order.depositStatus || order.DepositStatus || '').toLowerCase();
        const productStatus = (order.product?.status || order.product?.Status || '').toLowerCase();
        
        // Show all orders that have been deposited (buyer đã đặt cọc - "đã được đặt cọc")
        const isDeposited = orderStatus === 'deposited' || 
                           orderStatus === 'depositpaid' || 
                           orderStatus === 'deposit_paid' ||
                           depositStatus === 'paid' ||
                           depositStatus === 'succeeded';
        
        // Show completed orders (admin confirmed success - "đã bán")
        const isCompleted = orderStatus === 'completed' || 
                           productStatus === 'sold' || 
                           productStatus === 'completed';
        
        // Show cancelled/rejected orders (admin rejected - "đã bị từ chối")
        const isRejected = orderStatus === 'cancelled' || 
                          orderStatus === 'failed' ||
                          orderStatus === 'rejected';
        
        // Include all orders that have been deposited, completed, or rejected
        // Seller cần theo dõi tất cả orders từ khi buyer đặt cọc đến khi admin xét duyệt
        const shouldInclude = isDeposited || isCompleted || isRejected;
        
        if (shouldInclude) {
          console.log(`✅ Including seller order ${order.orderId || order.OrderId} - Order: ${orderStatus}, Deposit: ${depositStatus}, Product: ${productStatus}, Deposited: ${isDeposited}, Completed: ${isCompleted}, Rejected: ${isRejected}`);
        }
        
        return shouldInclude;
      });
      
      console.log(`✅ Filtered ${sellerOrdersFiltered.length} seller orders (deposited/completed/rejected) out of ${sellerOrders.length} total`);
      
      // Process sales with product details
      const salesWithDetails = await Promise.all(sellerOrdersFiltered.map(async (order) => {
        const productId = order.productId || order.ProductId || order.product?.productId || order.product?.id;
        
        if (!productId) {
          return null;
        }
        
        // Fetch product details to get latest status
        let productDetails = null;
        try {
          productDetails = await apiRequest(`/api/Product/${productId}`, 'GET');
          console.log(`✅ Fetched product ${productId} details:`, productDetails);
        } catch (error) {
          console.log(`⚠️ Failed to fetch product ${productId} details:`, error.message);
          // Continue with existing product data if fetch fails
        }
        
        // Fetch images for this product
        let productImages = [];
        try {
          const imageResponse = await apiRequest(`/api/ProductImage/product/${productId}`, 'GET');
          productImages = imageResponse || [];
        } catch (error) {
          console.log(`❌ Failed to fetch images for product ${productId}:`, error.message);
          productImages = [];
        }
        
        // Merge product data: prefer fetched productDetails, fallback to order.product
        const mergedProduct = productDetails ? {
          ...order.product,
          ...productDetails,
          status: productDetails.status || productDetails.Status || order.product?.status || order.product?.Status,
          images: productImages,
          primaryImage: productImages?.[0] || null
        } : {
          ...order.product,
          images: productImages,
          primaryImage: productImages?.[0] || null
        };
        
        return {
          orderId: order?.orderId || order?.OrderId || null,
          productId: productId,
          product: mergedProduct,
          buyerName: order.buyer?.fullName || order.buyerName || order.user?.fullName || 'N/A',
          orderStatus: order.status || order.orderStatus || order.Status || order.OrderStatus,
          cancellationReason: order.cancellationReason || order.CancellationReason || null
        };
      });
      
      // Filter out null values
      const validSales = salesWithDetails.filter(sale => sale !== null);
      
      console.log(`✅ Valid sales count: ${validSales.length}`);
      setSales(validSales);
    } catch (error) {
      console.error('Error loading sales:', error);
      show({
        title: 'Lỗi',
        description: 'Không thể tải danh sách đơn bán',
        type: 'error'
      });
    } finally {
      setSalesLoading(false);
    }
  };

  const handleReviewClick = (purchase) => {
    console.log('🔍 handleReviewClick called with purchase:', purchase);
    console.log('🔍 Purchase sellerId:', purchase.sellerId);
    console.log('🔍 Purchase seller:', purchase.seller);
    console.log('🔍 Purchase product:', purchase.product);
    console.log('🔍 Purchase product.sellerId:', purchase.product?.sellerId);
    setSelectedProduct(purchase);
    setReviewData({
      rating: 5,
      comment: ''
    });
    setShowReviewModal(true);
  };

  // Helper function để detect seller "Duy toi choi"
  const isDuyToiChoiProduct = (product) => {
    const checks = [
      product?.product?.title?.toLowerCase()?.includes('lambor'),
      product?.seller?.fullName?.includes('Duy toi choi'),
      product?.seller?.name?.includes('Duy toi choi'),
      product?.product?.seller?.fullName?.includes('Duy toi choi'),
      product?.product?.seller?.name?.includes('Duy toi choi'),
      product?.sellerName?.includes('Duy toi choi'),
      // Kiểm tra thêm các field khác có thể có
      product?.seller?.displayName?.includes('Duy toi choi'),
      product?.product?.seller?.displayName?.includes('Duy toi choi')
    ];
    
    const isDuyToiChoi = checks.some(check => check === true);
    console.log('🔍 Duy toi choi detection checks:', {
      productTitle: product?.product?.title,
      sellerFullName: product?.seller?.fullName,
      sellerName: product?.seller?.name,
      productSellerFullName: product?.product?.seller?.fullName,
      productSellerName: product?.product?.seller?.name,
      sellerNameField: product?.sellerName,
      isDuyToiChoi
    });
    
    return isDuyToiChoi;
  };

  const handleSubmitReview = async () => {
    try {
      // Debug: Log ALL data about the selected product
      console.log('🔍 ===== REVIEW SUBMISSION DEBUG =====');
      console.log('🔍 Selected Product FULL:', JSON.stringify(selectedProduct, null, 2));
      console.log('🔍 SellerId:', selectedProduct.sellerId);
      console.log('🔍 Seller:', selectedProduct.seller);
      console.log('🔍 Seller?.id:', selectedProduct.seller?.id);
      console.log('🔍 Product:', selectedProduct.product);
      console.log('🔍 Product?.sellerId:', selectedProduct.product?.sellerId);
      console.log('🔍 Product title:', selectedProduct.product?.title);
      console.log('🔍 Product seller info:', selectedProduct.product?.seller);
      
      // Get actual sellerId from order - try multiple fallback strategies
      const sellerId = selectedProduct.sellerId || 
                       selectedProduct.seller?.id || 
                       selectedProduct.product?.sellerId ||
                       selectedProduct.product?.seller?.id ||
                       (selectedProduct.product?.seller ? 
                         (selectedProduct.product.seller.id || selectedProduct.product.seller.userId) : 
                         null) ||
                       1;
      
      console.log('🔍 Using calculated sellerId:', sellerId);
      console.log('🔍 Will redirect to: /seller/' + sellerId);
      
      const requestData = {
        OrderId: selectedProduct.orderId,
        RevieweeId: sellerId, // Backend will override this anyway
        Rating: reviewData.rating,
        Content: reviewData.comment || ""
      };
      
      console.log('🔍 Request Data:', requestData);
      
      await apiRequest('/api/Review', {
        method: 'POST',
        body: requestData
      });

      show({
        title: 'Thành công!',
        description: 'Đánh giá của bạn đã được gửi',
        type: 'success'
      });

      setShowReviewModal(false);
      await loadPurchases(); // Reload to update review status
      
      // Don't redirect - let user stay on MyPurchases page
      console.log('🔍 Review submitted successfully, staying on MyPurchases page');
      console.log('🔍 ===== END REVIEW SUBMISSION DEBUG =====');
    } catch (error) {
      console.error('Error submitting review:', error);
      show({
        title: 'Lỗi',
        description: 'Không thể gửi đánh giá. Vui lòng thử lại',
        type: 'error'
      });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && activeTab === 'purchases') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách đơn mua...</p>
          </div>
        </div>
      </div>
    );
  }

  if (salesLoading && activeTab === 'sales') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách đơn bán...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lí đơn hàng</h1>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'purchases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Đơn mua</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <Store className="h-5 w-5" />
                <span>Đơn bán</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'purchases' && (
          <>

        {purchases.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn mua</h3>
            <p className="text-gray-600 mb-6">Bạn chưa có đơn hàng nào đã mua hoàn tất trên EV Market</p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((purchase) => (
              <div key={purchase.orderId} className="bg-white rounded-lg shadow-md overflow-hidden">
                {(() => {
                  const product = purchase.product;
                  if (!product) {
                    return (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                    );
                  }

                  // ✅ OPTIMIZED: Check for real product images first
                  const realImages = product.images || [];
                  const primaryImage = product.primaryImage || realImages[0];
                  
                  // ✅ OPTIMIZED: Handle different image formats
                  let imageUrl = null;
                  if (primaryImage) {
                    if (typeof primaryImage === 'string') {
                      imageUrl = primaryImage;
                    } else {
                      imageUrl = primaryImage.imageData || primaryImage.imageUrl || primaryImage.url || primaryImage.ImageData || primaryImage.ImageUrl;
                    }
                  }

                  if (imageUrl) {
                    return (
                      <div className="w-full h-48 relative overflow-hidden bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={product.title || 'Sản phẩm'}
                          className="w-full h-full object-cover transition-opacity duration-300"
                          loading="lazy"
                          onError={(e) => {
                            console.log(`❌ Image failed to load for ${product.title}:`, imageUrl);
                            // Fallback to placeholder
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                          onLoad={(e) => {
                            // Ensure image is visible when loaded
                            e.target.style.opacity = '1';
                          }}
                        />
                        
                        {/* Fallback placeholder */}
                        <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center absolute inset-0" style={{display: 'none'}}>
                          <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-4 left-4 w-8 h-8 bg-blue-200 rounded-full"></div>
                            <div className="absolute top-8 right-6 w-6 h-6 bg-indigo-200 rounded-full"></div>
                            <div className="absolute bottom-6 left-8 w-4 h-4 bg-blue-300 rounded-full"></div>
                            <div className="absolute bottom-4 right-4 w-10 h-10 bg-indigo-300 rounded-full"></div>
                          </div>
                          
                          <div className="relative z-10 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
                              <Package className="h-8 w-8 text-blue-600" />
                            </div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">
                              {product.title || 'Sản phẩm'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {product.vehicleType || product.productType || 'EV Market'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Status badge */}
                        <div className="absolute top-3 right-3">
                          {(() => {
                            const status = (purchase.orderStatus || purchase.status || purchase.OrderStatus || purchase.Status || '').toLowerCase();
                            const productStatus = (purchase.product?.status || purchase.product?.Status || purchase.productStatus || purchase.ProductStatus || '').toLowerCase();
                            
                            // Debug logging for buyer orders
                            if (productStatus === 'sold' || status === 'completed') {
                              console.log(`🔍 Buyer Order ${purchase.orderId || purchase.OrderId} - Status: ${status}, ProductStatus: ${productStatus}, Should show "Đã mua"`);
                            }
                            
                            // IMPORTANT: Check status in priority order (completed > rejected > deposited > pending)
                            // Completed first (highest priority - đã mua thành công)
                            // Check both order status AND product status to ensure accuracy
                            if (status === 'completed' || productStatus === 'sold' || productStatus === 'completed') {
                              return (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Đã mua
                                </span>
                              );
                            }
                            // Rejected second (đã bị từ chối)
                            else if (status === 'cancelled' || status === 'failed' || status === 'rejected') {
                              return (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Đã bị từ chối
                                </span>
                              );
                            }
                            // Deposited third (đã đặt cọc thành công)
                            // IMPORTANT: Only show "đã đặt cọc" if NOT completed/sold
                            else if ((status === 'deposited' || status === 'depositpaid' || status === 'deposit_paid') && 
                                     productStatus !== 'sold' && productStatus !== 'completed' && status !== 'completed') {
                              return (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Đã đặt cọc
                                </span>
                              );
                            }
                            // Pending last (đang trong quá trình đặt cọc)
                            else if (status === 'pending') {
                              return (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Đang đặt cọc
                                </span>
                              );
                            }
                            // Default
                            else {
                              return (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Đang xử lý
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    );
                  }

                  // No real images available, show placeholder
                  return (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Background pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 left-4 w-8 h-8 bg-blue-200 rounded-full"></div>
                        <div className="absolute top-8 right-6 w-6 h-6 bg-indigo-200 rounded-full"></div>
                        <div className="absolute bottom-6 left-8 w-4 h-4 bg-blue-300 rounded-full"></div>
                        <div className="absolute bottom-4 right-4 w-10 h-10 bg-indigo-300 rounded-full"></div>
                      </div>
                      
                      {/* Main content */}
                      <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
                          <Package className="h-8 w-8 text-blue-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                          {product.title || 'Sản phẩm'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {product.vehicleType || product.productType || 'EV Market'}
                        </p>
                      </div>
                      
                      {/* Status badge */}
                      <div className="absolute top-3 right-3">
                        {(() => {
                          const status = (purchase.orderStatus || purchase.status || '').toLowerCase();
                          const productStatus = (purchase.product?.status || '').toLowerCase();
                          
                          if (status === 'cancelled' || status === 'failed' || status === 'rejected') {
                            return (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Đã bị từ chối
                              </span>
                            );
                          } else if (status === 'completed' || productStatus === 'sold' || productStatus === 'completed') {
                            return (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Đã bán
                              </span>
                            );
                          } else if (status === 'deposited' || status === 'depositpaid' || status === 'deposit_paid') {
                            return (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Đã đặt cọc
                              </span>
                            );
                          } else if (status === 'pending') {
                            return (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Đang đặt cọc
                              </span>
                            );
                          } else {
                            return (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Đang xử lý
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  );
                })()}
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {purchase.product?.title || purchase.productTitle || 'Sản phẩm không tìm thấy'}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-green-600">
                      {formatPrice(purchase.totalAmount)}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      {(() => {
                        const status = (purchase.orderStatus || purchase.status || purchase.OrderStatus || purchase.Status || '').toLowerCase();
                        const productStatus = (purchase.product?.status || purchase.product?.Status || purchase.productStatus || purchase.ProductStatus || '').toLowerCase();
                        
                        // Debug logging for buyer orders detail view
                        if (productStatus === 'sold' || status === 'completed') {
                          console.log(`🔍 Buyer Order Detail ${purchase.orderId || purchase.OrderId} - Status: ${status}, ProductStatus: ${productStatus}, Should show "Đã mua"`);
                        }
                        
                        // IMPORTANT: Check status in priority order (completed > rejected > deposited > pending)
                        // Completed first (highest priority - đã mua thành công)
                        // Check both order status AND product status to ensure accuracy
                        if (status === 'completed' || productStatus === 'sold' || productStatus === 'completed') {
                          return (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                              Đã mua
                            </>
                          );
                        }
                        // Rejected second (đã bị từ chối)
                        else if (status === 'cancelled' || status === 'failed' || status === 'rejected') {
                          return (
                            <>
                              <XCircle className="h-4 w-4 mr-1 text-red-500" />
                              Đã bị từ chối
                            </>
                          );
                        }
                        // Deposited third (đã đặt cọc thành công)
                        // IMPORTANT: Only show "đã đặt cọc" if NOT completed/sold
                        else if ((status === 'deposited' || status === 'depositpaid' || status === 'deposit_paid') && 
                                 productStatus !== 'sold' && productStatus !== 'completed' && status !== 'completed') {
                          return (
                            <>
                              <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                              Đã đặt cọc
                            </>
                          );
                        }
                        // Pending last (đang trong quá trình đặt cọc)
                        else if (status === 'pending') {
                          return (
                            <>
                              <Clock className="h-4 w-4 mr-1 text-blue-500" />
                              Đang đặt cọc
                            </>
                          );
                        }
                        // Default
                        else {
                          return (
                            <>
                              <Clock className="h-4 w-4 mr-1 text-gray-500" />
                              Đang xử lý
                            </>
                          );
                        }
                      })()}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <p>Ngày tạo: {formatDate(purchase.createdDate || purchase.createdAt || purchase.purchaseDate)}</p>
                    {purchase.completedDate && (
                      <p>Ngày hoàn tất: {formatDate(purchase.completedDate)}</p>
                    )}
                    <p>Người bán: {purchase.sellerName || purchase.seller?.fullName || 'N/A'}</p>
                    {purchase.error && (
                      <p className="text-red-500 text-xs">⚠️ {purchase.error}</p>
                    )}
                  </div>
                  
                  {/* Show Rejection Reason if order is rejected */}
                  {((purchase.orderStatus || purchase.status || '').toLowerCase() === 'cancelled' || 
                    (purchase.orderStatus || purchase.status || '').toLowerCase() === 'failed' ||
                    (purchase.orderStatus || purchase.status || '').toLowerCase() === 'rejected') && 
                    purchase.cancellationReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                      <div className="flex items-start space-x-2">
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 mb-1">Giao dịch đã bị từ chối</h4>
                          <p className="text-sm text-red-800 mb-1">
                            <span className="font-medium">Lý do:</span> {purchase.cancellationReason}
                          </p>
                          <p className="text-xs text-red-600 mt-2">
                            Đơn hàng này đã bị admin từ chối. Sản phẩm đã được trả về trang chủ.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/product/${purchase.productId}`}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Xem lại
                    </Link>
                    
                    {purchase.canReview ? (
                      <button
                        onClick={() => handleReviewClick(purchase)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Đánh giá seller
                      </button>
                    ) : (
                      <div className="flex-1 bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-center text-sm font-medium flex items-center justify-center">
                        {purchase.hasRating ? (
                          <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                            Đã đánh giá
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-1" />
                            Chưa thể đánh giá
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}

        {activeTab === 'sales' && (
          <>
            {sales.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn bán</h3>
                <p className="text-gray-600 mb-6">Bạn chưa có đơn hàng nào đã bán trên EV Market</p>
                <Link
                  to="/my-listings"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Quản lý tin đăng
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sales.map((sale) => (
                  <div key={sale.orderId} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {(() => {
                      const product = sale.product;
                      if (!product) {
                        return (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <Package className="h-12 w-12 text-gray-400" />
                          </div>
                        );
                      }

                      // ✅ OPTIMIZED: Handle different image formats
                      const realImages = product.images || [];
                      const primaryImage = product.primaryImage || realImages[0];
                      
                      let imageUrl = null;
                      if (primaryImage) {
                        if (typeof primaryImage === 'string') {
                          imageUrl = primaryImage;
                        } else {
                          imageUrl = primaryImage.imageData || primaryImage.imageUrl || primaryImage.url || primaryImage.ImageData || primaryImage.ImageUrl;
                        }
                      }

                      if (imageUrl) {
                        return (
                          <div className="w-full h-48 relative overflow-hidden bg-gray-100">
                            <img
                              src={imageUrl}
                              alt={product.title || 'Sản phẩm'}
                              className="w-full h-full object-cover transition-opacity duration-300"
                              loading="lazy"
                              onError={(e) => {
                                console.log(`❌ Image failed to load for ${product.title}:`, imageUrl);
                                // Fallback to placeholder
                                e.target.style.display = 'none';
                                const placeholder = e.target.nextElementSibling;
                                if (placeholder) {
                                  placeholder.style.display = 'flex';
                                }
                              }}
                              onLoad={(e) => {
                                // Ensure image is visible when loaded
                                e.target.style.opacity = '1';
                              }}
                            />
                            <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center absolute inset-0" style={{display: 'none'}}>
                              <div className="relative z-10 text-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
                                  <Package className="h-8 w-8 text-blue-600" />
                                </div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                                  {product.title || 'Sản phẩm'}
                                </h4>
                              </div>
                            </div>
                            <div className="absolute top-3 right-3">
                              {(() => {
                                const status = (sale.orderStatus || sale.status || sale.OrderStatus || sale.Status || '').toLowerCase();
                                const productStatus = (sale.product?.status || sale.product?.Status || sale.productStatus || sale.ProductStatus || '').toLowerCase();
                                
                                // Debug logging for seller orders
                                if (productStatus === 'sold' || status === 'completed') {
                                  console.log(`🔍 Seller Order ${sale.orderId || sale.OrderId} - Status: ${status}, ProductStatus: ${productStatus}, Should show "Đã bán"`);
                                }
                                
                                // IMPORTANT: Check status in priority order (completed > rejected > deposited)
                                // Completed first (highest priority - đã bán thành công)
                                // Check both order status AND product status to ensure accuracy
                                if (status === 'completed' || productStatus === 'sold' || productStatus === 'completed') {
                                  return (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Đã bán
                                    </span>
                                  );
                                }
                                // Rejected second (đã bị từ chối)
                                else if (status === 'cancelled' || status === 'failed' || status === 'rejected') {
                                  return (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Đã bị từ chối
                                    </span>
                                  );
                                }
                                // Deposited third (đã được đặt cọc)
                                // IMPORTANT: Only show "đã được đặt cọc" if NOT completed/sold
                                else if ((status === 'deposited' || status === 'depositpaid' || status === 'deposit_paid') && 
                                         productStatus !== 'sold' && productStatus !== 'completed' && status !== 'completed') {
                                  return (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Đã được đặt cọc
                                    </span>
                                  );
                                }
                                // Default
                                else {
                                  return (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Đang chờ
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center relative overflow-hidden">
                          <div className="relative z-10 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
                              <Package className="h-8 w-8 text-blue-600" />
                            </div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">
                              {product.title || 'Sản phẩm'}
                            </h4>
                          </div>
                          <div className="absolute top-3 right-3">
                            {(() => {
                              const status = (sale.orderStatus || sale.status || sale.OrderStatus || sale.Status || '').toLowerCase();
                              const productStatus = (sale.product?.status || sale.product?.Status || sale.productStatus || sale.ProductStatus || '').toLowerCase();
                              
                              // Debug logging for seller orders
                              if (productStatus === 'sold' || status === 'completed') {
                                console.log(`🔍 Seller Order Card ${sale.orderId || sale.OrderId} - Status: ${status}, ProductStatus: ${productStatus}, Should show "Đã bán"`);
                              }
                              
                              // IMPORTANT: Check status in priority order (completed > rejected > deposited)
                              // Completed first (highest priority - đã bán thành công)
                              // Check both order status AND product status to ensure accuracy
                              if (status === 'completed' || productStatus === 'sold' || productStatus === 'completed') {
                                return (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Đã bán
                                  </span>
                                );
                              }
                              // Rejected second (đã bị từ chối)
                              else if (status === 'cancelled' || status === 'failed' || status === 'rejected') {
                                return (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Đã bị từ chối
                                  </span>
                                );
                              }
                              // Deposited third (đã được đặt cọc)
                              // IMPORTANT: Only show "đã được đặt cọc" if NOT completed/sold
                              else if ((status === 'deposited' || status === 'depositpaid' || status === 'deposit_paid') && 
                                       productStatus !== 'sold' && productStatus !== 'completed' && status !== 'completed') {
                                return (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Đã được đặt cọc
                                  </span>
                                );
                              }
                              // Default
                              else {
                                return (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Đang chờ
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      );
                    })()}
                    
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {sale.product?.title || sale.productTitle || 'Sản phẩm không tìm thấy'}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-bold text-green-600">
                          {formatPrice(sale.totalAmount)}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          {(() => {
                            const status = (sale.orderStatus || sale.status || sale.OrderStatus || sale.Status || '').toLowerCase();
                            const productStatus = (sale.product?.status || sale.product?.Status || sale.productStatus || sale.ProductStatus || '').toLowerCase();
                            
                            // Debug logging for seller orders
                            if (productStatus === 'sold' || status === 'completed') {
                              console.log(`🔍 Seller Order Detail ${sale.orderId || sale.OrderId} - Status: ${status}, ProductStatus: ${productStatus}, Should show "Đã bán"`);
                            }
                            
                            // IMPORTANT: Check status in priority order (completed > rejected > deposited)
                            // Completed first (highest priority - đã bán thành công)
                            // Check both order status AND product status to ensure accuracy
                            if (status === 'completed' || productStatus === 'sold' || productStatus === 'completed') {
                              return (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                  Đã bán
                                </>
                              );
                            }
                            // Rejected second (đã bị từ chối)
                            else if (status === 'cancelled' || status === 'failed' || status === 'rejected') {
                              return (
                                <>
                                  <XCircle className="h-4 w-4 mr-1 text-red-500" />
                                  Đã bị từ chối
                                </>
                              );
                            }
                            // Deposited third (đã được đặt cọc)
                            // IMPORTANT: Only show "đã được đặt cọc" if NOT completed/sold
                            else if ((status === 'deposited' || status === 'depositpaid' || status === 'deposit_paid') && 
                                     productStatus !== 'sold' && productStatus !== 'completed' && status !== 'completed') {
                              return (
                                <>
                                  <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                                  Đã được đặt cọc
                                </>
                              );
                            }
                            // Default
                            else {
                              return (
                                <>
                                  <Clock className="h-4 w-4 mr-1 text-blue-500" />
                                  Đang chờ
                                </>
                              );
                            }
                          })()}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4">
                        <p>Ngày tạo: {formatDate(sale.createdDate || sale.createdAt || sale.purchaseDate)}</p>
                        {sale.completedDate && (
                          <p>Ngày hoàn tất: {formatDate(sale.completedDate)}</p>
                        )}
                        <p>Người mua: {sale.buyerName || 'N/A'}</p>
                      </div>
                      
                      {/* Show Rejection Reason if order is rejected */}
                      {((sale.orderStatus || sale.status || '').toLowerCase() === 'cancelled' || 
                        (sale.orderStatus || sale.status || '').toLowerCase() === 'failed' ||
                        (sale.orderStatus || sale.status || '').toLowerCase() === 'rejected') && 
                        sale.cancellationReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                          <div className="flex items-start space-x-2">
                            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-red-900 mb-1">Giao dịch đã bị từ chối</h4>
                              <p className="text-sm text-red-800 mb-1">
                                <span className="font-medium">Lý do:</span> {sale.cancellationReason}
                              </p>
                              <p className="text-xs text-red-600 mt-2">
                                Đơn hàng này đã bị admin từ chối. Sản phẩm đã được trả về trang chủ.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Link
                          to={`/product/${sale.productId}`}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium flex items-center justify-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem lại
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Đánh giá sản phẩm
              </h3>
              {(() => {
                console.log('🔍 Modal rendering with selectedProduct:', selectedProduct);
                console.log('🔍 SellerId in modal:', selectedProduct.sellerId);
                console.log('🔍 Seller in modal:', selectedProduct.seller);
                return null;
              })()}
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {selectedProduct.product?.title}
                </p>
                <p className="text-sm text-blue-600 mb-1">
                  Seller ID: {selectedProduct.sellerId || 'N/A'}
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(selectedProduct.totalAmount)}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đánh giá của bạn
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`p-1 ${
                        star <= reviewData.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {reviewData.rating === 1 && 'Rất không hài lòng'}
                  {reviewData.rating === 2 && 'Không hài lòng'}
                  {reviewData.rating === 3 && 'Bình thường'}
                  {reviewData.rating === 4 && 'Hài lòng'}
                  {reviewData.rating === 5 && 'Rất hài lòng'}
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhận xét (tùy chọn)
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Gửi đánh giá
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPurchases;
