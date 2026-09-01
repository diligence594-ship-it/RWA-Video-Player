const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { fetchBatches, fetchSubjects, fetchTopics, fetchVideoUrl } = require("./modules/api.js");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve test.html on root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "test.html"));
});

// API Endpoints
app.post("/api/batches", fetchBatches);
app.post("/api/subjects", fetchSubjects);
app.post("/api/topics", fetchTopics);
app.post("/api/video", fetchVideoUrl);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on port ${PORT}`);
});
