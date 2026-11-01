
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "https://nepproject.netlify.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options(/.*/, cors({
  origin: "https://nepproject.netlify.app",
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

const authRoutes = require("./routes/auth.routes");
const interviewRoutes = require("./routes/interview.routes");

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);

module.exports = app;
