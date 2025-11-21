import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Zap,
  Heart,
  User,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { NotificationBell } from "../common/NotificationBell";
import { ChatBell } from "../common/ChatBell";

export const Header = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Generic handler to scroll to top when clicking link to current page
  const handleLinkClick = (targetPath) => {
    if (location.pathname === targetPath) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  const handleHomeClick = () => handleLinkClick("/");
  const handleFavoritesClick = () => handleLinkClick("/favorites");
  const handleDashboardClick = () => handleLinkClick("/dashboard");
  const handleAdminClick = () => handleLinkClick("/admin");
  const handleMyPurchasesClick = () => handleLinkClick("/my-purchases");
  const handleProfileClick = () => handleLinkClick("/profile");
  const handleLoginClick = () => handleLinkClick("/login");
  const handleRegisterClick = () => handleLinkClick("/register");
  const handleCreateListingClick = () => handleLinkClick("/create-listing");

  const containerClass = isAdmin
    ? "px-4 sm:px-6 lg:px-8" // flush-left for admin
    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"; // centered for public

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className={containerClass}>
        <div className="flex justify-between items-center h-16">
          {isAdmin ? (
            <Link 
              to="/admin" 
              state={{ resetDashboard: true }} 
              className="flex items-center space-x-2" 
              aria-label="Trang quản trị"
              onClick={handleAdminClick}
            >
              <div className="bg-blue-600 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">EV Market</span>
            </Link>
          ) : (
            <Link to="/" className="flex items-center space-x-2" aria-label="Trang chủ" onClick={handleHomeClick}>
              <div className="bg-blue-600 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">EV Market</span>
            </Link>
          )}


          <div className={`flex items-center ${isAdmin ? 'space-x-3' : 'space-x-4'}`}>
            {user ? (
              <>
                {!isAdmin && (
                  <Link
                    to="/favorites"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Yêu thích"
                    onClick={handleFavoritesClick}
                  >
                    <Heart className="h-5 w-5 text-gray-600" />
                  </Link>
                )}

                {!isAdmin && <NotificationBell />}

                {!isAdmin && <ChatBell />}

                {!isAdmin && (
                  <Link
                    to="/create-listing"
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    onClick={handleCreateListingClick}
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span className="hidden sm:inline">Đăng tin</span>
                  </Link>
                )}

                <div className="relative group">
                  <button className={`flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors ${isAdmin ? 'ml-2' : ''}`}>
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {profile?.full_name || user?.fullName || user?.email}
                    </span>
                  </button>

                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleAdminClick}
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Bảng điều khiển quản trị
                      </Link>
                    )}
                    {!isAdmin && (
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleDashboardClick}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Trang cá nhân
                      </Link>
                    )}
                    {!isAdmin && (
                      <Link
                        to="/my-purchases"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleMyPurchasesClick}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Quản lý đơn hàng
                      </Link>
                    )}
                    {!isAdmin && (
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleProfileClick}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Hồ sơ cá nhân
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={handleLoginClick}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleRegisterClick}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
