
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://YOUR-NETLIFY-SITE.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

const authRoutes = require("./routes/auth.routes");
const interviewRoutes = require("./routes/interview.routes");

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);

module.exports = app;
