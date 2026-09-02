const express = require("express");
const cors = require("cors");
const path = require("path");
require(".env").config();

const { 
    fetchBatches, 
    fetchSubjects, 
    fetchTopics, 
    fetchLectures, 
    fetchVideoUrl,
    proxyStream 
} = require("./modules/api.js");

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS & Json Body Parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from project root
app.use(express.static(__dirname));

// Health Check Endpoint (Deployment monitoring ke liye)
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Serve test.html on root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "test.html"));
});

// AppX API Endpoints
app.post("/api/batches", fetchBatches);
app.post("/api/subjects", fetchSubjects);
app.post("/api/topics", fetchTopics);
app.post("/api/lectures", fetchLectures);
app.post("/api/video", fetchVideoUrl);

// HLS Video Stream Proxy Endpoint
app.get("/api/proxy", proxyStream);

// 404 Fallback Catch-all
app.use((req, res) => {
    res.status(404).send("404 Not Found");
});

// Global Error Handler middleware
app.use((err, req, res, next) => {
    console.error("Server Error:", err.stack);
    res.status(500).json({ success: false, error: "Internal Server Error" });
});

// Prevent Node process crash from unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception thrown:", err);
});

// Start Express Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server successfully started on port ${PORT}`);
});
