
import { createContext, useEffect, useState } from "react";
import { profile } from "./services/auth.api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAndSetUser = async () => {
      try {
        const data = await profile();
        setUser(data.user);
      } catch (error) {
        console.error(
          "Profile fetch failed:",
          error.response?.data || error.message
        );
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getAndSetUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        setLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
