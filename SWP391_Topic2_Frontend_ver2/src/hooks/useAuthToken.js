import { useAuth } from "../contexts/AuthContext";

// Custom hook to get auth token
export const useAuthToken = () => {
  const { user } = useAuth();
  
  const getToken = () => {
    try {
      const authData = localStorage.getItem("evtb_auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.token || null;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }
    return null;
  };

  return {
    token: getToken(),
    user,
    isAuthenticated: !!user && !!getToken()
  };
};
