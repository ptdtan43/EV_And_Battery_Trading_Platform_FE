import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";

export const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token") || params.get("access_token") || "";
    const userJson = params.get("user");

    const saveAndRedirect = (session) => {
      try {
        localStorage.setItem("evtb_auth", JSON.stringify(session));
      } catch {}
      // ✅ FIX: Handle both roleId (number) and role (string "Staff", "Admin", etc.)
      const roleId = session?.user?.roleId || session?.profile?.roleId || session?.user?.role;
      const roleName = (session?.user?.roleName || session?.profile?.role || session?.user?.role || "")
        .toString()
        .toLowerCase();
      const userRole = (session?.user?.role || session?.profile?.role || "")
        .toString()
        .toLowerCase();
      
      // ✅ FIX: Check role by both roleId and roleName/role (case-insensitive)
      const isAdmin = roleId === 1 || roleId === "1" || roleName === "admin" || userRole === "admin";
      const isStaff = roleId === 3 || roleId === "3" || roleName === "staff" || userRole === "staff";
      
      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else if (isStaff) {
        navigate("/staff", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    };

    (async () => {
      try {
        if (token) {
          const user = userJson ? JSON.parse(userJson) : null;
          saveAndRedirect({ token, user, profile: user?.profile || null });
          return;
        }
        const resp = await fetch(
          `${API_BASE_URL}/api/Auth/callback${location.search}`
        );
        if (!resp.ok) throw new Error("OAuth callback thất bại");
        const data = await resp.json();
        const session = {
          token: data.token || data.accessToken,
          user: data.user || data,
        };
        saveAndRedirect(session);
      } catch (e) {
        setError(e.message || "Không thể đăng nhập bằng mạng xã hội");
      }
    })();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="text-gray-700">Đang xử lý đăng nhập...</div>
      )}
    </div>
  );
};
