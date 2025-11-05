import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Package, Star, CheckCircle, Eye, MessageSquare } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const MyPurchases = () => {
  const { user } = useAuth();
  const { show } = useToast();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
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
      
      // Filter to only show completed/sold purchases
      const completedOrders = orders.filter(order => {
        const orderStatus = order.status || order.orderStatus;
        const productStatus = order.product?.status;
        
        console.log(`🔍 Order ${order.orderId} - Order status: ${orderStatus}, Product status: ${productStatus}`);
        console.log(`🔍 Order ${order.orderId} - ProductId: ${order.productId}, Product:`, order.product);
        
        // Check if this order has valid productId (like admin dashboard shows sold products)
        const productId = order.product?.productId || order.product?.id || order.productId || order.product?.ProductId;
        const hasValidProductId = productId && productId !== null;
        
        if (hasValidProductId) {
          console.log(`✅ Order ${order.orderId} has valid productId: ${productId}`);
          console.log(`🔍 Order ${order.orderId} - Product title: ${order.product?.title}, Price: ${order.product?.price}`);
        } else {
          console.log(`❌ Order ${order.orderId} has invalid productId: ${productId}`);
        }
        
        // Check if this order belongs to current user and has valid productId
        const isCurrentUserOrder = order.buyerId === userId;
        
        console.log(`🔍 Order ${order.orderId} - buyerId: ${order.buyerId}, current userId: ${userId}, isCurrentUserOrder: ${isCurrentUserOrder}`);
        
        // Only show products with "sold" status like admin dashboard
        // Check if product status is "sold" (this is the key condition from admin dashboard)
        const isProductSold = productStatus === 'sold' || productStatus === 'Sold' || 
                              productStatus === 'completed' || productStatus === 'Completed' ||
                              productStatus === 'finished' || productStatus === 'Finished' ||
                              productStatus === 'active' || productStatus === 'Active';
        
        // Show all sold products like admin dashboard (not just current user's)
        const shouldInclude = hasValidProductId && isProductSold;
        
        if (shouldInclude) {
          console.log(`✅ Including order ${order.orderId} - Order: ${orderStatus}, Product: ${productStatus}`);
        } else {
          console.log(`❌ Excluding order ${order.orderId} - Order: ${orderStatus}, Product: ${productStatus}`);
        }
        
        return shouldInclude;
      });
      
      console.log(`🔍 Total orders: ${orders.length}, Completed orders: ${completedOrders.length}`);
      console.log(`🔍 Completed orders details:`, completedOrders.map(o => ({
        orderId: o.orderId,
        orderStatus: o.status,
        productStatus: o.product?.status,
        productTitle: o.product?.title
      })));
      
      // Process orders - only completed ones
      console.log(`🔍 About to process ${completedOrders.length} completed orders`);
      
      // Fetch images for all products first
      const purchasesWithDetails = await Promise.all(completedOrders.map(async (order, index) => {
        console.log(`🔍 Processing completed order ${index} (OrderId: ${order.orderId}):`, order);
        
        // Check if product data is already included
        if (order.product) {
          console.log(`✅ Order ${index} already has product data:`, order.product);
          console.log(`🔍 Product fields:`, Object.keys(order.product));
          
        // Extract productId from the product object (API /api/Order/buyer structure)
        const productId = order.product?.productId || order.product?.id || order.productId || order.product?.ProductId;
          
          // Skip orders with invalid product data
          if (!productId || productId === null) {
            console.log(`⚠️ Order ${order.orderId} has invalid productId (${productId}), skipping`);
            return null;
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
          
          // Update product with images
          const productWithImages = {
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
              console.log(`🔍 Order ${order.orderId} sellerId calculation:`, {
                orderSellerId: order.sellerId,
                orderSellerIdFromSeller: order.seller?.id,
                productSellerId: order.product?.sellerId,
                finalSellerId: sellerId
              });
              return sellerId;
            })(), // Fallback to 1
            canReview: !order.hasRating, // All orders are completed/sold after filtering
            orderStatus: order.product?.status || order.status || order.orderStatus || 'completed'
          };
        }
        
        // Fallback: try to find productId in various field names
        const productId = order.productId || order.product_id || order.ProductId || order.Product_ID || 
                         order.itemId || order.item_id;
        
        if (!productId) {
          console.error(`❌ Order ${index} has no product data or productId:`, order);
          console.error(`❌ Available fields:`, Object.keys(order));
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
          product: {
            productId: productId,
            images: productImages,
            primaryImage: productImages?.[0] || null
          },
          sellerId: (() => {
            const sellerId = order.sellerId || order.seller?.id || order.product?.sellerId || 1;
            console.log(`🔍 Order ${order.orderId} sellerId calculation (fallback):`, {
              orderSellerId: order.sellerId,
              orderSellerIdFromSeller: order.seller?.id,
              productSellerId: order.product?.sellerId,
              finalSellerId: sellerId
            });
            return sellerId;
          })(), // Fallback to 1
          canReview: !order.hasRating, // All orders are completed/sold after filtering
          orderStatus: order.product?.status || order.status || order.orderStatus || 'completed'
        };
      }));
      
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
        description: 'Không thể tải danh sách sản phẩm đã mua',
        type: 'error'
      });
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách sản phẩm đã mua...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sản phẩm đã mua</h1>
          <p className="mt-2 text-gray-600">
            Quản lý và đánh giá các sản phẩm bạn đã mua
          </p>
        </div>

        {purchases.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có sản phẩm đã mua</h3>
            <p className="text-gray-600 mb-6">Bạn chưa có sản phẩm nào đã mua hoàn tất hoặc đã bán trên EV Market</p>
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

                  // Check for real product images first
                  const realImages = product.images || [];
                  const primaryImage = product.primaryImage || realImages[0];
                  
                  console.log(`🖼️ Product ${product.title} - Real images:`, realImages);
                  console.log(`🖼️ Product ${product.title} - Primary image:`, primaryImage);

                  if (primaryImage) {
                    const imageUrl = primaryImage.imageData || primaryImage.imageUrl || primaryImage;
                    return (
                      <div className="w-full h-48 relative overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={product.title || 'Sản phẩm'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log(`❌ Real image failed to load for ${product.title}:`, primaryImage);
                            console.log(`❌ Image URL was:`, imageUrl);
                            // Fallback to placeholder
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
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
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Đã bán
                          </span>
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
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Đã bán
                        </span>
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
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Đã giao dịch 
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
