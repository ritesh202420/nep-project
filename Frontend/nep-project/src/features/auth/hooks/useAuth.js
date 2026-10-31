
import { useContext } from "react";
import { AuthContext } from "../auth.context";
import {
  login,
  register,
  logout,
  profile,
} from "../services/auth.api.js";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  const {
    user,
    setUser,
    loading,
    setLoading,
  } = context;

  const handleLogin = async ({ email, password }) => {
    setLoading(true);

    try {
      const data = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({
    username,
    email,
    password,
  }) => {
    setLoading(true);

    try {
      const data = await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // Registration success: update user only if API
      // actually returns a user.
      if (data?.user) {
        setUser(data.user);
      }

      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      const data = await logout();

      setUser(null);

      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getProfile = async () => {
    setLoading(true);

    try {
      const data = await profile();

      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    handleLogin,
    handleRegister,
    handleLogout,
    getProfile,
  };
};
