// src/app.js
const express = require("express");
const cors = require("cors");
const config = require('./config/config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/queries", require("./routes/queryRoutes"));
app.use("/api/knowledge-base", require("./routes/knowledgeBaseRoutes"));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Knowledge Base System is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate field value entered",
    });
  }

  res.status(500).json({
    success: false,
    message: "Server Error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;

// server.js
require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/utils/database");

const PORT = config.port;

// Connect to database
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.env}`);
});
