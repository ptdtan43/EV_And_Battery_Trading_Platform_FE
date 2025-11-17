import { useEffect } from "react";
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
import { StaffDashboard } from "./pages/StaffDashboard";
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
import { Reviews } from "./pages/Reviews";
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

const PAYMENT_STORAGE_KEY = "evtb_payment_success";
const DEFAULT_PAYMENT_AMOUNT = "5000000";

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>
);

const getRoleInfo = (user, profile) => {
  const roleIdRaw =
    user?.roleId ?? profile?.roleId ?? user?.role ?? profile?.role;
  const roleName = (
    user?.roleName ||
    profile?.roleName ||
    user?.role ||
    profile?.role ||
    ""
  )
    .toString()
    .toLowerCase();
  const roleId =
    typeof roleIdRaw === "string" ? Number(roleIdRaw) || roleIdRaw : roleIdRaw;

  return {
    isAdmin: roleId === 1 || roleName === "admin",
    isStaff: roleId === 3 || roleName === "staff",
  };
};

const readStoredPaymentAmount = () => {
  try {
    const raw = localStorage.getItem(PAYMENT_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed?.amount;
  } catch {
    return undefined;
  }
};

const redirectToPaymentSuccess = ({
  paymentId,
  amount,
  transactionNo = "",
  paymentType = "Deposit",
}) => {
  if (!paymentId) return;

  const query = new URLSearchParams({
    payment_success: "true",
    payment_id: paymentId,
    amount: amount || DEFAULT_PAYMENT_AMOUNT,
    transaction_no: transactionNo || "",
    payment_type: paymentType || "Deposit",
  });

  window.location.replace(`${window.location.origin}/?${query.toString()}`);
};

const shouldIgnoreMessage = (data) =>
  !data ||
  typeof data !== "object" ||
  data.posdMessageId ||
  data.type === "VIDEO_XHR_CANDIDATE" ||
  data.from === "detector";

const handlePaymentMessage = (data) => {
  if (data.status === "success" && data.paymentId) {
    const amount = data.amount ?? readStoredPaymentAmount();
    redirectToPaymentSuccess({
      paymentId: data.paymentId,
      amount,
      transactionNo: data.transactionNo,
      paymentType: data.type,
    });
    return true;
  }

  if (data.type === "EVTB_PAYMENT_SUCCESS" && data.payload) {
    const { paymentId, amount, transactionNo } = data.payload;
    redirectToPaymentSuccess({ paymentId, amount, transactionNo });
    return true;
  }

  return false;
};

const usePaymentRedirectListener = () => {
  useEffect(() => {
    const handleMessage = (event) => {
      const { data } = event;
      if (shouldIgnoreMessage(data)) {
        return;
      }

      if (handlePaymentMessage(data)) {
        return;
      }

      if (data.type === "EVTB_REDIRECT" && data.url) {
        window.location.replace(data.url);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
};

const useScrollToTop = (pathname) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
};

const PublicRoute = ({ children }) => {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    const { isAdmin, isStaff } = getRoleInfo(user, profile);
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isStaff) return <Navigate to="/staff" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const ProtectedRoute = ({
  children,
  adminOnly = false,
  staffOnly = false,
  userOnly = false,
}) => {
  const { user, profile, loading } = useAuth();
  const { isAdmin, isStaff } = getRoleInfo(user, profile);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to={isStaff ? "/staff" : "/dashboard"} replace />;
  }

  if (staffOnly && !isStaff) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  if (userOnly && (isAdmin || isStaff)) {
    return <Navigate to={isAdmin ? "/admin" : "/staff"} replace />;
  }

  return children;
};

const AppContent = () => {
  const { loading } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isStaffRoute = location.pathname.startsWith("/staff");

  useScrollToTop(location.pathname);
  usePaymentRedirectListener();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && !isStaffRoute && <Header />}
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
              <ProtectedRoute userOnly>
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
              <ProtectedRoute userOnly>
                <CreateListing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-listings"
            element={
              <ProtectedRoute userOnly>
                <MyListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trash"
            element={
              <ProtectedRoute userOnly>
                <Trash />
              </ProtectedRoute>
            }
          />

          <Route
            path="/listing/:id/edit"
            element={
              <ProtectedRoute userOnly>
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

          <Route
            path="/staff"
            element={
              <ProtectedRoute staffOnly>
                <StaffDashboard />
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
      {!isAdminRoute && !isStaffRoute && <Footer />}
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
