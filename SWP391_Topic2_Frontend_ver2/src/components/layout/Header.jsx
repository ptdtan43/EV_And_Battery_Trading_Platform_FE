import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  Search,
  Heart,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { NotificationBell } from "../common/NotificationBell";

export const Header = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">EV Market</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Trang chủ
            </Link>
            {!isAdmin && (
              <Link
                to="/search"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Đăng tin bán
              </Link>
            )}
            <Link
              to="/about"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Cách thức hoạt động
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Tìm kiếm"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </button>

            {user ? (
              <>
                <Link
                  to="/favorites"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Yêu thích"
                >
                  <Heart className="h-5 w-5 text-gray-600" />
                </Link>

                <NotificationBell />

                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {profile?.full_name}
                    </span>
                  </button>

                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    )}
                    {!isAdmin && (
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Trang cá nhân
                      </Link>
                    )}
                    {!isAdmin && (
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
