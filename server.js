import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { fetchBatches, fetchSubjects, fetchTopics, fetchVideoUrl } from './modules/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic CORS Security Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
}));

app.use(express.json());
app.use(express.static(__dirname));

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "test.html"));
});

app.post("/api/batches", fetchBatches);
app.post("/api/subjects", fetchSubjects);
app.post("/api/topics", fetchTopics);
app.post("/api/video", fetchVideoUrl);

app.listen(PORT, () => {
    console.log(`Server active on port ${PORT}`);
});
