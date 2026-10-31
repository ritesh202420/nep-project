import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

export async function register({ username, email, password }) {
  try {
    const response = await api.post("/api/auth/register", {
      username,
      email,
      password,
    });

    return response.data;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
}

export async function login({ email, password }) {
  try {
    const response = await api.post("/api/auth/login", {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

export async function logout() {
  try {
    const response = await api.post("/api/auth/logout");

    return response.data;
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
}

export async function profile() {
  try {
    const response = await api.get("/api/auth/profile");

    return response.data;
  } catch (error) {
    console.error("Profile fetch failed:", error);
    throw error;
  }
}