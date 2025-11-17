import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";

const SESSION_KEY = "evtb_auth";

const AuthContext = createContext(null);

const VIETNAMESE_FIXES = {
  "B?o": "Bảo",
  "Th?ch": "Thạch",
  "Nguy?n": "Nguyễn",
  "Tr?n": "Trần",
  "Ph?m": "Phạm",
  "H?:ng": "Hương",
  "Th?y": "Thúy",
  "M?nh": "Mạnh",
  "V?n": "Văn",
  "Th?": "Thư",
  "Qu?c": "Quốc",
  "Vi?t": "Việt",
  "B?c": "Bắc",
  "D?ng": "Dũng",
};

const TOKEN_FIELDS = [
  "token",
  "accessToken",
  "jwt",
  "tokenString",
  "data.token",
  "data.accessToken",
  "data.jwt",
  "result.token",
  "result.accessToken",
  "result.jwt",
  "data.data.token",
  "data.data.accessToken",
  "data.data.jwt",
];

const USER_FIELDS = [
  "user",
  "data.user",
  "result.user",
  "data.data.user",
  "data.data.data.user",
];

const PROFILE_FIELDS = [
  "profile",
  "data.profile",
  "result.profile",
  "data.data.profile",
  "data.data.data.profile",
];

const toPathValue = (source, path) => {
  return path.split(".").reduce((value, key) => value?.[key], source);
};

const fixVietnameseEncoding = (value) => {
  if (!value || typeof value !== "string" || !value.includes("?")) {
    return value;
  }

  return Object.entries(VIETNAMESE_FIXES).reduce(
    (result, [incorrect, correct]) =>
      result.replace(new RegExp(incorrect.replace("?", "\\?"), "g"), correct),
    value
  );
};

const safeJsonParse = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const normalizeToken = (payload) => {
  for (const field of TOKEN_FIELDS) {
    const value = toPathValue(payload, field);
    if (value) {
      return value;
    }
  }
  return null;
};

const normalizeProfile = (payload) => {
  for (const field of PROFILE_FIELDS) {
    const candidate = toPathValue(payload, field);
    if (candidate) {
      return {
        ...candidate,
        id: candidate.id ?? candidate.profileId ?? null,
        fullName: fixVietnameseEncoding(
          candidate.fullName ?? candidate.full_name ?? candidate.name ?? ""
        ),
        phone: candidate.phone ?? "",
      };
    }
  }
  return null;
};

const normalizeUser = (rawUser, fallbackEmail = "") => {
  if (!rawUser && !fallbackEmail) {
    return null;
  }

  const email = (
    rawUser?.email ||
    rawUser?.Email ||
    fallbackEmail ||
    ""
  ).trim();
  const id =
    rawUser?.id || rawUser?.userId || rawUser?.accountId || rawUser?.Id || null;
  const userId = rawUser?.userId || rawUser?.accountId || id;
  const roleIdRaw =
    rawUser?.roleId ?? rawUser?.RoleId ?? rawUser?.role ?? rawUser?.Role;
  const roleId =
    typeof roleIdRaw === "string" ? Number(roleIdRaw) || roleIdRaw : roleIdRaw;
  const roleName =
    rawUser?.roleName || rawUser?.RoleName || rawUser?.role || rawUser?.Role;

  return {
    ...rawUser,
    id,
    userId,
    email,
    fullName: fixVietnameseEncoding(
      rawUser?.fullName ||
        rawUser?.FullName ||
        rawUser?.full_name ||
        rawUser?.name ||
        ""
    ),
    phone: rawUser?.phone || rawUser?.Phone || "",
    avatar: rawUser?.avatar || rawUser?.Avatar || "",
    roleId,
    roleName,
    role: roleName || roleId,
    accountStatus: rawUser?.accountStatus || rawUser?.AccountStatus || "Active",
  };
};

const buildSessionFromResponse = (payload, email) => {
  const token = normalizeToken(payload);

  let user = null;
  for (const field of USER_FIELDS) {
    const candidate = toPathValue(payload, field);
    if (candidate) {
      user = normalizeUser(candidate, email);
      break;
    }
  }

  if (!user && email) {
    user = normalizeUser(
      {
        email,
        id: payload?.accountId || payload?.userId || null,
        userId: payload?.accountId || payload?.userId || null,
        roleId: payload?.role,
        roleName: payload?.roleName || payload?.role,
      },
      email
    );
  }

  return {
    token,
    user,
    profile: normalizeProfile(payload),
    refreshToken:
      payload?.refreshToken ||
      payload?.data?.refreshToken ||
      payload?.result?.refreshToken ||
      null,
  };
};

const readStoredSession = () => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  const parsed = safeJsonParse(raw);
  if (!parsed?.token || !parsed?.user) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  return {
    token: parsed.token,
    refreshToken: parsed.refreshToken,
    user: parsed.user,
    profile: parsed.profile ?? null,
  };
};

const persistSession = (session) => {
  if (!session?.token || !session?.user) {
    throw new Error("Session must include both token and user data.");
  }

  const normalizedUser = normalizeUser(session.user, session.user.email);
  const payload = {
    token: session.token,
    refreshToken: session.refreshToken,
    user: normalizedUser,
    profile: session.profile ?? null,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  return payload;
};

const clearStoredSession = () => localStorage.removeItem(SESSION_KEY);

const shouldRetryWithFormData = (error) => {
  if (!error || error.status !== 400) {
    return false;
  }
  const source = error.data || {};
  const title = (source.title || source.message || "").toLowerCase();
  return title.includes("validation") || Boolean(source.errors);
};

const createFormData = (values) => {
  const form = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    form.append(key, value ?? "");
  });
  return form;
};

const fetchDirectoryUser = async (token, email) => {
  if (!token || !email) {
    return null;
  }

  try {
    const users = await apiRequest("/api/User");
    if (Array.isArray(users)) {
      const currentUser = users.find(
        (entry) => entry.email?.toLowerCase() === email.toLowerCase()
      );
      return currentUser ? normalizeUser(currentUser, email) : null;
    }
  } catch (error) {
    console.warn("Unable to fetch detailed user profile:", error);
  }

  return null;
};

const mergeUserData = (current, extra) => {
  if (!extra) {
    return current;
  }
  const normalizedExtra = normalizeUser(extra, current?.email);
  return {
    ...current,
    ...normalizedExtra,
    id: normalizedExtra?.id ?? current?.id,
    userId: normalizedExtra?.userId ?? current?.userId,
  };
};

const getRoleFlags = (user, profile) => {
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = readStoredSession();
      if (stored) {
        setUser(stored.user);
        setProfile(stored.profile);
      }
    } catch (error) {
      console.error("Error loading stored session:", error);
      clearStoredSession();
    } finally {
      setLoading(false);
    }
  }, []);

  const hydrateSessionState = (session) => {
    const persisted = persistSession(session);
    setUser(persisted.user);
    setProfile(persisted.profile);
    return persisted;
  };

  const signOut = () => {
    clearStoredSession();
    setUser(null);
    setProfile(null);
  };

  const clearCorruptedData = () => {
    clearStoredSession();
    setUser(null);
    setProfile(null);
  };

  const clearAuthStorage = () => {
    clearStoredSession();
  };

  const updateProfile = async (updates = {}) => {
    if (!user) {
      return null;
    }

    const userId = user.id || user.userId || user.accountId;
    if (!userId) {
      throw new Error("Không tìm thấy ID người dùng");
    }

    const payload = {
      id: userId,
      email: updates.email ?? user.email,
      fullName: updates.fullName ?? user.fullName ?? "",
      phone: updates.phone ?? user.phone ?? "",
      avatar: updates.avatar ?? user.avatar ?? "",
      roleId: user.roleId ?? 2,
      accountStatus: updates.accountStatus ?? user.accountStatus ?? "Active",
    };

    const updatedUser = await apiRequest(`/api/User/${userId}`, {
      method: "PUT",
      body: payload,
    });

    const normalized = normalizeUser(
      { ...user, ...updatedUser, ...updates },
      payload.email
    );
    const stored = readStoredSession();
    if (stored?.token) {
      persistSession({
        ...stored,
        user: normalized,
      });
    }
    setUser(normalized);
    return normalized;
  };

  const signUp = async (email, password, fullName, phone = "") => {
    const registerPayload = {
      Email: email,
      Password: password,
      FullName: fullName,
      Phone: phone || "",
      RoleId: 2,
      AccountStatus: "Active",
    };

    const submit = async (body) =>
      apiRequest("/api/User/register", {
        method: "POST",
        body,
      });

    let data;
    try {
      data = await submit(registerPayload);
    } catch (error) {
      if (shouldRetryWithFormData(error)) {
        data = await submit(createFormData(registerPayload));
      } else {
        throw error;
      }
    }

    let session = buildSessionFromResponse(data, email);

    if (!session.token) {
      return signIn(email, password);
    }

    if (!session.user) {
      session.user = normalizeUser(
        {
          email,
          fullName,
          phone,
          roleId: 2,
          roleName: "User",
        },
        email
      );
    }

    return hydrateSessionState(session);
  };

  const signIn = async (email, password) => {
    const response = await apiRequest("/api/User/login", {
      method: "POST",
      body: { email, password },
    });

    let session = buildSessionFromResponse(response, email);
    if (!session.token) {
      throw new Error("Đăng nhập thất bại - thiếu token xác thực");
    }

    if (!session.user) {
      session.user = normalizeUser(
        {
          email,
          id: response?.accountId || response?.userId,
          userId: response?.accountId || response?.userId,
          roleId: response?.role,
          roleName: response?.roleName || response?.role,
        },
        email
      );
    }

    session = hydrateSessionState(session);

    const directoryUser = await fetchDirectoryUser(session.token, email);
    if (directoryUser) {
      session = hydrateSessionState({
        ...session,
        user: mergeUserData(session.user, directoryUser),
      });
    }

    return session;
  };

  const { isAdmin, isStaff } = useMemo(
    () => getRoleFlags(user, profile),
    [user, profile]
  );

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    isStaff,
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearAuthStorage,
    clearCorruptedData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
