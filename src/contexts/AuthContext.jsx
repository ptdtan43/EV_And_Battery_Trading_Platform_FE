import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest, API_BASE_URL } from "../lib/api";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Helper function to fix Vietnamese character encoding
const fixVietnameseEncoding = (str) => {
  if (!str || typeof str !== "string") return str;

  // Only fix if the string contains the specific encoding issues
  if (!str.includes("?")) {
    return str;
  }

  // Common encoding fixes for Vietnamese characters
  const fixes = {
    "B?o": "Bảo",
    "Th?ch": "Thạch",
    "Nguy?n": "Nguyễn",
    "Tr?n": "Trần",
    "Ph?m": "Phạm",
    "H?:ng": "Hồng",
    "Th?y": "Thủy",
    "M?nh": "Mạnh",
    "V?n": "Văn",
    "Th?": "Thị",
    "Qu?c": "Quốc",
    "Vi?t": "Việt",
    "B?c": "Bắc",
    "Đ?ng": "Đông",
  };

  let fixed = str;
  Object.entries(fixes).forEach(([wrong, correct]) => {
    fixed = fixed.replace(new RegExp(wrong.replace("?", "\\?"), "g"), correct);
  });

  return fixed;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("evtb_auth");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            console.log("🔄 Loading user from localStorage:", parsed?.user);
            console.log("🔍 Token present:", !!parsed?.token);
            console.log("🔍 Token length:", parsed?.token?.length || 0);
            
            // Check if token is valid before setting user
            if (parsed?.token && parsed?.user) {
              setUser(parsed.user);
              setProfile(parsed?.profile || null);
              console.log("✅ User loaded successfully from localStorage");
            } else {
              console.warn("⚠️ Invalid auth data - missing token or user");
              localStorage.removeItem("evtb_auth");
              setUser(null);
              setProfile(null);
            }
          } catch (parseError) {
            console.warn("Corrupted auth data, clearing localStorage");
            localStorage.removeItem("evtb_auth");
            setUser(null);
            setProfile(null);
          }
        } else {
          console.log("📭 No auth data found in localStorage");
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Error loading auth data:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signOut = () => {
    localStorage.removeItem("evtb_auth");
    setUser(null);
    setProfile(null);
  };

  const clearCorruptedData = () => {
    localStorage.removeItem("evtb_auth");
    setUser(null);
    setProfile(null);
    console.log("Cleared corrupted user data");
  };

  // Utility function to clear localStorage when quota is exceeded
  const clearAuthStorage = () => {
    try {
      localStorage.removeItem("evtb_auth");
      console.log("Auth storage cleared");
    } catch (error) {
      console.error("Could not clear auth storage:", error);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;

    try {
      const userId = user.id || user.userId || user.accountId;
      if (!userId) {
        throw new Error("Không tìm thấy ID người dùng");
      }

      console.log("🔄 Updating profile for user ID:", userId);
      console.log("📝 Updates:", updates);

      // Call API to update user in database
      const updatePayload = {
        id: userId,
        email: updates.email || user.email,
        fullName: updates.fullName || user.fullName || user.full_name,
        phone: updates.phone || user.phone,
        avatar: updates.avatar || user.avatar,
        roleId: user.roleId,
        accountStatus: user.accountStatus || "Active",
      };

      console.log("📤 Sending update payload:", updatePayload);

      const updatedUserData = await apiRequest(`/api/User/${userId}`, {
        method: "PUT",
        body: updatePayload,
      });

      console.log("✅ Profile updated in database:", updatedUserData);

      // Update local state with the new data
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      // Update localStorage with the new data
      const authData = localStorage.getItem("evtb_auth");
      if (authData) {
        try {
          const parsed = JSON.parse(authData);

          // Store only essential data to reduce size
          const optimizedAuth = {
            token: parsed.token,
            user: {
              id: updatedUser.id || updatedUser.userId,
              email: updatedUser.email,
              fullName: updatedUser.fullName || updatedUser.full_name,
              phone: updatedUser.phone,
              avatar: updatedUser.avatar,
              roleId: updatedUser.roleId,
              roleName: updatedUser.roleName,
            },
            profile: parsed.profile
              ? {
                  id: parsed.profile.id,
                  fullName: parsed.profile.fullName || parsed.profile.full_name,
                  phone: parsed.profile.phone,
                }
              : null,
          };

          localStorage.setItem("evtb_auth", JSON.stringify(optimizedAuth));
          console.log("✅ Profile updated in localStorage");
        } catch (storageError) {
          console.warn("Could not save to localStorage:", storageError);
          // Clear old data and try again with minimal data
          localStorage.removeItem("evtb_auth");
          const minimalAuth = {
            token: parsed?.token,
            user: {
              id: updatedUser.id || updatedUser.userId,
              email: updatedUser.email,
              fullName: updatedUser.fullName || updatedUser.full_name,
            },
          };
          localStorage.setItem("evtb_auth", JSON.stringify(minimalAuth));
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error; // Re-throw to let Profile component handle it
    }
  };

  const buildSession = (data, email) => {
    // Normalize possible backend shapes
    const normalizedToken =
      data?.token ||
      data?.accessToken ||
      data?.jwt ||
      data?.tokenString ||
      data?.data?.token ||
      data?.data?.accessToken ||
      data?.data?.jwt ||
      data?.result?.token ||
      data?.result?.accessToken ||
      data?.result?.jwt ||
      data?.data?.data?.token ||
      data?.data?.data?.accessToken ||
      data?.data?.data?.jwt;

    const normalizedUser =
      data?.user ||
      data?.data?.user ||
      data?.result?.user ||
      data?.data?.data?.user ||
      data?.data?.data?.data?.user ||
      null;

    const normalizedProfile =
      data?.profile ||
      data?.data?.profile ||
      data?.result?.profile ||
      data?.data?.data?.profile ||
      data?.data?.data?.data?.profile ||
      null;

    // If we have user data, normalize it
    if (normalizedUser) {
      const userData = normalizedUser;
      const normalizedUserData = {
        ...userData,
        fullName: fixVietnameseEncoding(
          userData.fullName || userData.full_name || userData.name
        ),
        email: userData.email || email,
        phone: userData.phone,
        id: userData.userId || userData.id || userData.accountId,
        userId: userData.userId || userData.id || userData.accountId,
        roleId: userData.roleId || userData.role || userData.roleId,
        roleName: userData.roleName || userData.role || userData.roleName,
      };

      return {
        token: normalizedToken,
        user: normalizedUserData,
        profile: normalizedProfile,
      };
    }

    // If no user data but we have email, create minimal user object
    if (email) {
      return {
        token: normalizedToken,
        user: {
          email: email,
          id: data?.userId || data?.id || data?.accountId,
          userId: data?.userId || data?.id || data?.accountId,
        },
        profile: normalizedProfile,
      };
    }

    return {
      token: normalizedToken,
      user: null,
      profile: normalizedProfile,
    };
  };

  const signUp = async (email, password, fullName, phone = "") => {
    console.log("Register data being sent:", {
      email,
      password,
      fullName,
      phone,
      full_name: fullName,
    });

    // Backend expects JSON with [FromBody], so try JSON first
    let data;
    let lastError;

    // Try JSON formats first (backend uses [FromBody] which expects JSON)
    const possibleFormats = [
      // Format 1: PascalCase with RoleId and AccountStatus (matches backend RegisterRequest)
      {
        Email: email,
        Password: password,
        FullName: fullName,
        Phone: phone || "",
        RoleId: 2,
        AccountStatus: "Active",
      },
      // Format 2: PascalCase without RoleId and AccountStatus
      {
        Email: email,
        Password: password,
        FullName: fullName,
        Phone: phone || "",
      },
      // Format 3: camelCase
      {
        email: email,
        password: password,
        fullName: fullName,
        phone: phone || "",
        roleId: 2,
        accountStatus: "Active",
      },
    ];

    // Try each JSON format
    for (let i = 0; i < possibleFormats.length; i++) {
      try {
        console.log(`Trying JSON format ${i + 1}:`, possibleFormats[i]);
        data = await apiRequest("/api/User/register", {
          method: "POST",
          body: possibleFormats[i],
        });
        console.log(`JSON format ${i + 1} succeeded:`, data);
        break; // Success, exit loop
      } catch (error) {
        console.log(`JSON format ${i + 1} failed:`, error.message);
        lastError = error;
      }
    }

    // If all JSON formats failed, try FormData as fallback
    if (!data) {
      try {
        console.log("All JSON formats failed, trying FormData as fallback...");
        const form = new FormData();
        form.append("Email", email);
        form.append("Password", password);
        form.append("FullName", fullName);
        form.append("Phone", phone || "");
        form.append("RoleId", "2");
        form.append("AccountStatus", "Active");

        data = await apiRequest("/api/User/register", {
          method: "POST",
          body: form,
        });
        console.log("FormData succeeded:", data);
      } catch (formError) {
        console.log("FormData also failed:", formError.message);
        lastError = formError;
      }
    }

    // If all attempts failed, throw the last error
    if (!data) {
      throw (
        lastError ||
        new Error("Registration failed: All data formats rejected by server")
      );
    }

    console.log("Register response:", data);

    // Backend returns { token, user } directly
    // Try different response formats to find what backend returns
    const possibleResponseFormats = [
      // Format 1: Direct response { token, user }
      data,
      // Format 2: Nested in data
      data?.data,
      // Format 3: Nested in result
      data?.result,
      // Format 4: Double nested
      data?.data?.data,
      data?.data?.result,
      data?.result?.data,
    ];

    let session = null;

    for (const format of possibleResponseFormats) {
      if (!format) continue;

      console.log("Trying response format:", format);

      // Check if this format has both token and user
      const token = format?.token || format?.accessToken || format?.jwt || format?.tokenString;
      const userData = format?.user;

      // Backend returns { token, user } format, so we need both
      if (token && userData) {
        console.log("Found valid response format with token and user:", format);

        // Normalize user data
        const normalizedUser = {
          ...userData,
          fullName: fixVietnameseEncoding(
            userData.fullName || userData.full_name || userData.name || fullName
          ),
          email: userData.email || email,
          phone: userData.phone || phone,
          id: userData.userId || userData.id || userData.accountId,
          userId: userData.userId || userData.id || userData.accountId,
          roleId: userData.roleId || userData.role || userData.roleId,
          roleName: userData.roleName || userData.role || userData.roleName,
        };

        session = {
          token: token,
          user: normalizedUser,
          profile: format?.profile || null,
        };

        console.log("Created session:", session);
        console.log("Session token:", session.token ? "Present" : "Missing", session.token?.length || 0);
        console.log("Session user:", session.user);

        // Ensure we have both token and user before saving
        if (session.token && session.user) {
          localStorage.setItem("evtb_auth", JSON.stringify(session));
          setUser(session.user);
          setProfile(session.profile || null);
          console.log(
            "✅ User registered and logged in successfully:",
            session.user
          );
          return session;
        } else {
          console.error("❌ Cannot save registration session - missing token or user");
          console.error("Token present:", !!session.token);
          console.error("User present:", !!session.user);
          console.error("User data:", userData);
        }
      }
    }

    // Many backends don't return token on register; try auto-login to obtain token
    try {
      console.log(
        "No token in registration response, attempting auto-login..."
      );
      const session = await signIn(email, password);
      console.log("🔍 Auto-login session:", session);
      console.log(
        "🔍 Auto-login token:",
        session?.token ? "Present" : "Missing"
      );

      // If no token, create a fallback token for development
      if (!session?.token) {
        console.warn("⚠️ No token from auto-login, creating fallback token");
        session.token = `dev_token_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      }

      // Ensure we have both token and user before saving
      if (session?.token && session?.user) {
        localStorage.setItem("evtb_auth", JSON.stringify(session));
        setUser(session.user);
        setProfile(session.profile || null);
        console.log(
          "✅ User registered and auto-logged in successfully:",
          session.user
        );
        return session;
      } else {
        console.error("❌ Cannot save auto-login session - missing token or user");
        throw new Error("Auto-login failed - missing authentication data");
      }
    } catch (loginError) {
      console.error("Auto-login after register failed:", loginError);
      throw new Error(
        "Registration completed but auto-login failed. Please try logging in manually."
      );
    }
  };

  const signIn = async (email, password) => {
    console.log("🔍 SignIn: Starting login for", email);
    const data = await apiRequest("/api/User/login", {
      method: "POST",
      body: { email, password },
    });

    console.log("🔍 SignIn: Backend response:", data);
    console.log("🔍 SignIn: Response keys:", Object.keys(data || {}));

    // Normalize possible backend shapes
    const normalizedToken =
      data?.token ||
      data?.accessToken ||
      data?.jwt ||
      data?.tokenString ||
      data?.data?.token ||
      data?.data?.accessToken ||
      data?.data?.jwt ||
      data?.result?.token ||
      data?.result?.accessToken ||
      data?.result?.jwt ||
      data?.data?.data?.token ||
      data?.data?.data?.accessToken ||
      data?.data?.data?.jwt;

    const normalizedUser =
      data?.user ||
      data?.data?.user ||
      data?.result?.user ||
      data?.data?.data?.user ||
      data?.data?.data?.data?.user ||
      null;

    const normalizedProfile =
      data?.profile || data?.data?.profile || data?.result?.profile || null;

    console.log("=== SIGNIN DEBUG ===");
    console.log("Login API response:", data);
    console.log("Normalized token:", normalizedToken ? "Present" : "Missing");
    console.log("Token length:", normalizedToken?.length || 0);
    console.log("Normalized user data:", normalizedUser);
    console.log("User roleId:", normalizedUser?.roleId);
    console.log("User roleName:", normalizedUser?.roleName);
    console.log("Data role:", data?.role);
    console.log("Data accountId:", data?.accountId);

    const session = buildSession(data, email);
    console.log("Initial session:", session);

    // If we have user data, normalize it
    if (normalizedUser) {
      const userData = normalizedUser;
      const normalizedUserData = {
        ...userData,
        fullName: fixVietnameseEncoding(
          userData.fullName || userData.full_name || userData.name
        ),
        email: userData.email || email,
        phone: userData.phone,
        id: userData.userId || userData.id || userData.accountId,
        userId: userData.userId || userData.id || userData.accountId,
        roleId: userData.roleId || userData.role || userData.roleId,
        roleName: userData.roleName || userData.role || userData.roleName,
      };

      session.user = normalizedUserData;
    }

    // If no user data but we have role and accountId from backend response
    if (!session.user && data?.role && data?.accountId) {
      console.log("Creating user from role and accountId");
      session.user = {
        email: email,
        id: data.accountId,
        userId: data.accountId,
        roleId: data.role,
        role: data.role,
      };
    }

    // Try to get full user profile from /api/User (fallback if /api/User/me fails)
    try {
      console.log("=== FETCHING USER PROFILE ===");
      console.log("Current email:", email);
      console.log("Current session user before update:", session.user);

      const usersData = await apiRequest("/api/User", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });
      console.log("User API response:", usersData);
      console.log("Users data type:", typeof usersData);
      console.log("Is array:", Array.isArray(usersData));

      if (Array.isArray(usersData)) {
        console.log("Total users found:", usersData.length);
        console.log(
          "All user emails:",
          usersData.map((u) => u.email)
        );

        // Find current user by email
        const currentUser = usersData.find((u) => u.email === email);
        console.log("Found current user:", currentUser);
        console.log("Current user fullName:", currentUser?.fullName);
        console.log("Current user phone:", currentUser?.phone);

        if (currentUser) {
          const fullUserData = {
            ...session.user,
            fullName: fixVietnameseEncoding(
              currentUser.fullName ||
                currentUser.full_name ||
                currentUser.name ||
                session.user?.fullName
            ),
            phone: currentUser.phone || session.user?.phone,
            email: currentUser.email || email,
            avatar: currentUser.avatar || session.user?.avatar,
            id:
              currentUser.userId ||
              currentUser.id ||
              currentUser.accountId ||
              session.user?.id,
            userId:
              currentUser.userId ||
              currentUser.id ||
              currentUser.accountId ||
              session.user?.userId,
            roleId:
              currentUser.roleId || currentUser.role || session.user?.roleId,
            roleName:
              currentUser.roleName ||
              currentUser.role ||
              session.user?.roleName,
          };

          console.log("Updated user with full profile:", fullUserData);
          console.log("Final fullName:", fullUserData.fullName);
          console.log("Final phone:", fullUserData.phone);
          session.user = fullUserData;

          // Update localStorage and state to trigger re-render
          localStorage.setItem("evtb_auth", JSON.stringify(session));
          setUser(session.user);
        } else {
          console.warn("No user found with email:", email);
        }
      } else {
        console.warn("Users data is not an array:", usersData);
      }
      console.log("=== END FETCHING USER PROFILE ===");
    } catch (userError) {
      console.warn(
        "Failed to fetch user profile from /api/User:",
        userError.message
      );
    }

    // TEMPORARY FIX: Override roleId for admin@gmail.com
    if (session.user && email === "admin@gmail.com") {
      console.log("TEMPORARY FIX: Overriding roleId for admin@gmail.com");
      session.user.roleId = 1;
      session.user.role = 1;
    }

    // If no user data but we have email, create minimal user object
    if (!session.user && email) {
      session.user = {
        email: email,
        id: data?.userId || data?.id || data?.accountId,
        userId: data?.userId || data?.id || data?.accountId,
      };
    }

    console.log("Final session:", session);
    console.log(
      "🔍 Final session token:",
      session?.token ? "Present" : "Missing"
    );
    console.log("🔍 Final session token length:", session?.token?.length || 0);

    // Ensure we have both token and user before saving
    if (session?.token && session?.user) {
      localStorage.setItem("evtb_auth", JSON.stringify(session));
      setUser(session.user);
      setProfile(session.profile || null);
      console.log("✅ Session saved to localStorage and state");
    } else {
      console.error("❌ Cannot save session - missing token or user");
      console.error("Token present:", !!session?.token);
      console.error("User present:", !!session?.user);
      throw new Error("Login failed - missing authentication data");
    }

    console.log("Final session to return:", session);
    console.log("==================");

    return session;
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearAuthStorage,
    clearCorruptedData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
