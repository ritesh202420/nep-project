
import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import "./auth.form.scss";
import { useAuth } from "../auth/hooks/useAuth";

function Login() {
  const { loading, handleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    try {
      const result = await handleLogin({
        email: email.trim().toLowerCase(),
        password,
      });

      setMessageType("success");
      setMessage(
        result?.message ||
        result?.data?.message ||
        "Login successful!"
      );

      // Give the user time to see the success message
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Login failed:", error);

      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please check your email and password."
      );
    }
  };

  return (
    <main>
      <div className="form-container">
        <h1>Login</h1>

        {message && (
          <p
            role="alert"
            style={{
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "5px",
              color: messageType === "success" ? "green" : "red",
              backgroundColor:
                messageType === "success" ? "#e8f8ed" : "#fdecec",
            }}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              id="email"
              name="email"
              placeholder="Enter email address"
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="button primary-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
