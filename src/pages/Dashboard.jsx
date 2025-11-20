 import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  DollarSign,
  Eye,
  Heart,
  Settings,
  Plus,
  TrendingUp,
  Users,
  MessageSquare,
  Star,
  Award,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Target,
  XCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api";
import { ProductCard } from "../components/molecules/ProductCard";
import { formatPrice } from "../utils/formatters";
import { ChatAI } from "../components/common/ChatAI";
import { MyListings } from "./MyListings";

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    conversionRate: 0,
    recentActivity: 0,
    monthlyGrowth: 0,
  });

  useEffect(() => {
    if (user) {
      console.log("=== DASHBOARD USER DATA ===");
      console.log("User object:", user);
      console.log("Profile object:", profile);
      console.log("User fullName:", user?.fullName);
      console.log("User full_name:", user?.full_name);
      console.log("User phone:", user?.phone);
      console.log("===========================");
      loadStats();
    }
  }, [user, profile]);

  const loadStats = async () => {
    try {
      console.log("🔍 Loading dashboard stats...");
      const sellerId = user?.id || user?.accountId || user?.userId || 1;

      // Load user's products
      const products = await apiRequest(`/api/Product/seller/${sellerId}`);
      console.log("🔍 Products loaded for stats:", products);

      if (Array.isArray(products)) {
        const totalListings = products.length;

        // Debug: Show all product statuses
        console.log(
          "🔍 Product statuses:",
          products.map((p) => ({
            id: p.productId || p.id,
            title: p.title,
            status: p.status,
            rawStatus: p.status,
          }))
        );

        // Check for different possible status values
        const activeListings = products.filter((p) => {
          const status = String(p.status || p.Status || "").toLowerCase();
          const isActive =
            status === "approved" ||
            status === "active" ||
            status === "published" ||
            status === "available" ||
            status === "live";

          console.log(
            `Product ${
              p.productId || p.id
            }: status="${status}", isActive=${isActive}`
          );
          return isActive;
        }).length;

        const soldListings = products.filter((p) => {
          const status = String(p.status || p.Status || "").toLowerCase();
          return status === "sold";
        }).length;

        const conversionRate =
          totalListings > 0
            ? Math.round((soldListings / totalListings) * 100)
            : 0;

        setStats({
          totalListings,
          activeListings,
          soldListings,
          conversionRate,
          recentActivity: 0, // Mock data
          monthlyGrowth: 0, // Mock data
        });

        console.log("✅ Stats updated:", {
          totalListings,
          activeListings,
          soldListings,
          conversionRate,
        });

        // Debug: Show detailed breakdown
        console.log("📊 Detailed breakdown:");
        console.log("  Total products:", totalListings);
        console.log("  Active products:", activeListings);
        console.log("  Sold products:", soldListings);
        console.log("  Conversion rate:", conversionRate + "%");
      }
    } catch (error) {
      console.error("❌ Error loading stats:", error);
    }
  };

  console.log("🔍 Dashboard render state:", {
    user: !!user,
    profile: !!profile,
    stats: stats,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-4xl font-bold text-white mb-2">
                Chào mừng,{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  {user?.fullName ||
                    user?.full_name ||
                    user?.name ||
                    profile?.fullName ||
                    profile?.full_name ||
                    profile?.name ||
                    user?.email?.split("@")[0] ||
                    "bạn"}
                </span>
                !
              </h1>
              <p className="text-blue-100 text-lg">
                Quản lý tin đăng và theo dõi hoạt động của bạn
              </p>
            </div>

            <div className="flex space-x-4">
              <Link
                to="/create-listing"
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full hover:bg-white/30 transition-all duration-200 flex items-center space-x-2 border border-white/20"
              >
                <Plus className="h-5 w-5" />
                <span>Đăng tin mới</span>
              </Link>
              <Link
                to="/my-listings"
                className="bg-white text-blue-600 px-6 py-3 rounded-full hover:bg-blue-50 transition-all duration-200 flex items-center space-x-2"
              >
                <Eye className="h-5 w-5" />
                <span>Xem tất cả</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Listings */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Tổng tin đăng
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.totalListings}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    +{stats.monthlyGrowth}%
                  </span>
                </div>
              </div>
              <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Listings */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Đang hoạt động
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.activeListings}
                </p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    Đang hiển thị
                  </span>
                </div>
              </div>
              <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Sold Listings */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Đã bán</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.soldListings}
                </p>
                <div className="flex items-center mt-2">
                  <Target className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600 font-medium">
                    {stats.conversionRate || 0}% tỷ lệ
                  </span>
                </div>
              </div>
              <div className="p-4 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* MyListings Component */}
        <div className="w-full">
          <MyListings />
        </div>
      </div>
      
      {/* Chat AI Component */}
      <ChatAI />
    </div>
  );
};
