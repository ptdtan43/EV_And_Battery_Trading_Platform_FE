import { useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Header } from "./components/organisms/Header";
import { Footer } from "./components/organisms/Footer";
import { HomePage } from "./pages/HomePage";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CreateListing } from "./pages/CreateListing";
import { EditListing } from "./pages/EditListing";
import { MyListings } from "./pages/MyListings";
import { Trash } from "./pages/Trash";
import { LoginForm } from "./components/organisms/auth/LoginForm";
import { RegisterForm } from "./components/organisms/auth/RegisterForm";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { AuthCallback } from "./pages/AuthCallback";
import { ProductDetail } from "./pages/ProductDetail";
import { SellerProfile } from "./pages/SellerProfile";
import { SellerProducts } from "./pages/SellerProducts";
import { Favorites } from "./pages/Favorites";
import { Notifications } from "./pages/Notifications";
import { Products } from "./pages/Products";
import { Categories } from "./pages/Categories";
import { Brands } from "./pages/Brands";
import { Deals } from "./pages/Deals";
// Simple Reviews component for testing
const Reviews = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Reviews Page</h1>
          <p className="text-gray-600">This is a simple reviews page for testing.</p>
        </div>
      </div>
    </div>
  );
};
import MyPurchases from "./pages/MyPurchases";
import { Help } from "./pages/Help";
import { FAQ } from "./pages/FAQ";
import { Contact } from "./pages/Contact";
import { Shipping } from "./pages/Shipping";
import { Returns } from "./pages/Returns";
import PaymentResult from "./pages/PaymentResult";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentExample from "./pages/PaymentExample";
import ApiTest from "./components/ApiTest";
import UserDebug from "./components/UserDebug";
import { ToastProvider } from "./contexts/ToastContext";
import { ChatHistory } from "./pages/ChatHistory";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is already logged in, redirect to appropriate dashboard
  if (user) {
    const roleId = user?.roleId || user?.role;
    const roleName = (user?.roleName || user?.role || "")
      .toString()
      .toLowerCase();
    const isAdmin = roleId === 1 || roleId === "1" || roleName === "admin";

    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return children;
};

const ProtectedRoute = ({ children, adminOnly = false, userOnly = false }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check admin status using roleId or role
  const roleId = user?.roleId || profile?.roleId || user?.role || profile?.role;
  const roleName = (
    user?.roleName ||
    profile?.roleName ||
    user?.role ||
    profile?.role ||
    ""
  )
    .toString()
    .toLowerCase();
  const isAdmin = roleId === 1 || roleId === "1" || roleName === "admin";

  console.log("=== ROLE CHECK DEBUG ===");
  console.log("User object:", user);
  console.log("Profile object:", profile);
  console.log("RoleId:", roleId);
  console.log("RoleName:", roleName);
  console.log("IsAdmin:", isAdmin);
  console.log("========================");

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  if (userOnly && isAdmin) {
    return <Navigate to="/admin" />;
  }

  return children;
};

const AppContent = () => {
  const { loading } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  // ✅ Global message listener for payment redirect - works from ANY page
  useEffect(() => {
    const handleGlobalMessage = (event) => {
      try {
        const data = event.data || {};
        console.log('[App] Received global message:', data);
        
        // Filter out messages from browser extensions
        if (data.posdMessageId || data.type === 'VIDEO_XHR_CANDIDATE' || data.from === 'detector') {
          return;
        }
        
        // Handle payment success message
        // ✅ Check for different message formats from backend
        if (data.status === 'success' && data.paymentId) {
          console.log('[App] Payment success received, redirecting to homepage');
          const { paymentId, amount, type } = data;
          const frontendUrl = window.location.origin;
          
          // ✅ Get amount from localStorage if not in message
          let amountValue = amount;
          if (!amountValue) {
            try {
              const storageData = localStorage.getItem('evtb_payment_success');
              if (storageData) {
                const parsed = JSON.parse(storageData);
                amountValue = parsed.amount;
              }
            } catch (e) {
              console.error('Could not read from localStorage:', e);
            }
          }
          
          // Use default amount if still not provided
          // ✅ Make sure amount is in VNPay format (cents, string)
          amountValue = amountValue || '5000000'; // Default 50,000 VND in cents
          
          console.log('[App] Using amount:', amountValue);
          const redirectUrl = `${frontendUrl}/?payment_success=true&payment_id=${paymentId}&amount=${amountValue}&transaction_no=&payment_type=${type || 'Deposit'}`;
          
          console.log('[App] Redirecting to:', redirectUrl);
          // Redirect immediately
          window.location.replace(redirectUrl);
        }
        
        // ✅ Also check for EVTB_PAYMENT_SUCCESS format (for backward compatibility)
        if (data.type === 'EVTB_PAYMENT_SUCCESS' && data.payload) {
          console.log('[App] Payment success received (alternative format), redirecting to homepage');
          const { paymentId, amount, transactionNo } = data.payload;
          const frontendUrl = window.location.origin;
          const redirectUrl = `${frontendUrl}/?payment_success=true&payment_id=${paymentId}&amount=${amount}&transaction_no=${transactionNo}`;
          
          // Redirect immediately
          window.location.replace(redirectUrl);
        }
        
        // Handle redirect message
        if (data.type === 'EVTB_REDIRECT' && data.url) {
          console.log('[App] Global redirect message received, redirecting to:', data.url);
          window.location.replace(data.url);
        }
      } catch (error) {
        console.error('[App] Error in global message handler:', error);
      }
    };
    
    window.addEventListener('message', handleGlobalMessage);
    return () => window.removeEventListener('message', handleGlobalMessage);
  }, []);

  // show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Header />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginForm />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterForm />
              </PublicRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute userOnly={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-listing"
            element={
              <ProtectedRoute userOnly={true}>
                <CreateListing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-listings"
            element={
              <ProtectedRoute userOnly={true}>
                <MyListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trash"
            element={
              <ProtectedRoute userOnly={true}>
                <Trash />
              </ProtectedRoute>
            }
          />

          <Route
            path="/listing/:id/edit"
            element={
              <ProtectedRoute userOnly={true}>
                <EditListing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Seller Routes */}
          <Route path="/seller/:id" element={<SellerProfile />} />
          <Route path="/seller/:id/products" element={<SellerProducts />} />

          {/* Favorites Route */}
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />

          {/* My Purchases Route */}
          <Route
            path="/my-purchases"
            element={
              <ProtectedRoute>
                <MyPurchases />
              </ProtectedRoute>
            }
          />

          {/* Notifications Route */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Footer Pages - Public Routes */}
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/reviews" element={<Reviews />} />
          
          {/* Chat Routes */}
          <Route
            path="/chats"
            element={
              <ProtectedRoute>
                <ChatHistory />
              </ProtectedRoute>
            }
          />
          
          <Route path="/help" element={<Help />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/payment/result" element={<PaymentResult />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/example" element={<PaymentExample />} />
          <Route path="/api/test" element={<ApiTest />} />
          <Route path="/user/debug" element={<UserDebug />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
