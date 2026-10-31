
import { createBrowserRouter, Navigate } from "react-router";
import Login from "./features/pages/Login";
import Register from "./features/pages/Register";
import Protected from "./features/auth/component/protected";
import Home from "./features/pages/Home";
import Interview from "./features/pages/Interview";
import Dashboard from "./features/pages/Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/Home" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/Home",
    element: (
      <Protected>
        <Home />
      </Protected>
    ),
  },
  {
  path: "/dashboard",
  element: (
    <Protected>
      <Dashboard />
    </Protected>
  ),
},

  {
    path: "/interview/:interviewId",
    element: (
      <Protected>
        <Interview />
      </Protected>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
