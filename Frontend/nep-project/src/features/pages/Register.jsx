
import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../auth/hooks/useAuth";

const Register = () => {
  const navigate = useNavigate();
  const { loading, handleRegister } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    try {
      const result = await handleRegister({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setMessageType("success");
      setMessage(
        result?.message ||
        result?.data?.message ||
        "Registration successful!"
      );

      // Redirect only when registration succeeds
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Registration failed:", error);

      setMessageType("error");
      setMessage(
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed. Please try again."
      );
    }
  };

  return (
    <main>
      <div className="form-container">
        <h1>Register</h1>

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
            <label htmlFor="username">Username</label>
            <input
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              id="username"
              name="username"
              placeholder="Username"
              value={username}
              autoComplete="username"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email"
              name="email"
              placeholder="Enter email address"
              value={email}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
              value={password}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="button primary-button"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
