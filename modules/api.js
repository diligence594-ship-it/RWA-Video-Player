const fetch = require("node-fetch");

const API_BASE = process.env.API_BASE || "rozgarapinew.teachx.in";
const USER_TOKEN = process.env.APPX_TOKEN || "";
const USER_ID = process.env.APPX_USERID || "4300255";
const PROXY_BASE = "https://appx-sign-urls-g-483856624945.herokuapp.com";

// Universal Headers extracted from AppX API Standards
function getAppxHeaders() {
    return {
        "Content-Type": "application/json; charset=UTF-8",
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 11; M2007J20CI Build/RP1A.200720.011)",
        "token": USER_TOKEN,
        "authorization": USER_TOKEN,
        "userid": USER_ID,
        "User-ID": USER_ID,
        "Client-Service": "AppX",
        "Auth-Key": "appxapi"
    };
}

async function fetchBatches(req, res) {
    try {
        // AppX direct route for courses
        const url = `https://${API_BASE}/get/mycourses`;
        const response = await fetch(url, {
            method: "POST",
            headers: getAppxHeaders(),
            body: JSON.stringify({ userid: USER_ID, token: USER_TOKEN })
        });

        const data = await response.json();
        const batchList = data.data || data.courses || data.result || [];
        res.json(batchList);
    } catch (err) {
        console.error("Batches Error:", err.message);
        res.json([]);
    }
}

async function fetchSubjects(req, res) {
    const { batch_id } = req.body;
    try {
        const url = `https://${API_BASE}/get/subjectbycourse`;
        const response = await fetch(url, {
            method: "POST",
            headers: getAppxHeaders(),
            body: JSON.stringify({ course_id: batch_id, userid: USER_ID, token: USER_TOKEN })
        });

        const data = await response.json();
        const subjectList = data.data || data.subjects || data.result || [];
        res.json(subjectList);
    } catch (err) {
        console.error("Subjects Error:", err.message);
        res.json([]);
    }
}

async function fetchTopics(req, res) {
    const { subject_id } = req.body;
    try {
        const url = `https://${API_BASE}/get/topicbysubject`;
        const response = await fetch(url, {
            method: "POST",
            headers: getAppxHeaders(),
            body: JSON.stringify({ subject_id: subject_id, userid: USER_ID, token: USER_TOKEN })
        });

        const data = await response.json();
        const topicList = data.data || data.topics || data.result || [];
        res.json(topicList);
    } catch (err) {
        console.error("Topics Error:", err.message);
        res.json([]);
    }
}

async function fetchVideoUrl(req, res) {
    const { course_id, video_id } = req.body;

    // Direct proxy link logic from appx player
    const proxyUrl = `${PROXY_BASE}/fetch_video?api_base=${API_BASE}&course_id=${course_id}&video_id=${video_id}&token=${USER_TOKEN}&userid=${USER_ID}`;

    try {
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data && data.data) {
            res.json({
                success: true,
                video_url: data.data.video_url || data.data.stream_url || data.data.link,
                pdf_url: data.data.pdf_url || null
            });
        } else {
            res.status(400).json({ success: false, message: "Stream link extraction failed" });
        }
    } catch (err) {
        console.error("Video Fetch Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = {
    fetchBatches,
    fetchSubjects,
    fetchTopics,
    fetchVideoUrl
};
