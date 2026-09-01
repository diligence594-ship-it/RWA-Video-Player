const fetch = require("node-fetch");

const API_BASE = process.env.API_BASE || "rozgarapinew.teachx.in";
const USER_TOKEN = process.env.APPX_TOKEN || "";
const USER_ID = process.env.APPX_USERID || "4300255";

async function makeApiRequest(endpoint, bodyData = {}) {
    // Universal headers required by TeachX/AppX backend
    const headers = {
        "Content-Type": "application/json",
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 11; M2007J20CI Build/RP1A.200720.011)",
        "token": USER_TOKEN,
        "authorization": USER_TOKEN,
        "userid": USER_ID,
        "Accept": "application/json",
        "Client-Service": "AppX",
        "Auth-Key": "appxapi",
        "User-ID": USER_ID
    };

    // Construct full URL (Handling optional /api/ or direct path)
    const url = endpoint.startsWith("http") 
        ? endpoint 
        : `https://${API_BASE}/${endpoint.replace(/^\//, '')}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                ...bodyData,
                token: USER_TOKEN,
                userid: USER_ID
            })
        });

        const rawText = await response.text();

        // Check if response is valid JSON before parsing
        try {
            return JSON.parse(rawText);
        } catch (jsonErr) {
            console.error(`[API HTML Blocked] URL: ${url} | Raw Response: ${rawText.substring(0, 150)}...`);
            return { success: false, raw: rawText };
        }
    } catch (error) {
        console.error(`API Fetch Error [${endpoint}]:`, error);
        return { success: false, message: error.message };
    }
}

async function fetchBatches(req, res) {
    const data = await makeApiRequest("get_batches", req.body);
    const batchList = data.data || data.batches || data.result || [];
    res.json(batchList);
}

async function fetchSubjects(req, res) {
    const { batch_id } = req.body;
    const data = await makeApiRequest("get_subjects", { batch_id });
    const subjectList = data.data || data.subjects || data.result || [];
    res.json(subjectList);
}

async function fetchTopics(req, res) {
    const { subject_id } = req.body;
    const data = await makeApiRequest("get_topics", { subject_id });
    const topicList = data.data || data.topics || data.result || [];
    res.json(topicList);
}

async function fetchVideoUrl(req, res) {
    const { course_id, video_id } = req.body;
    const data = await makeApiRequest("fetch_video", { course_id, video_id });
    
    if (data && data.data) {
        res.json({
            success: true,
            video_url: data.data.video_url || data.data.stream_url || data.data.link,
            pdf_url: data.data.pdf_url || null
        });
    } else {
        res.status(400).json({ success: false, message: "Unable to extract video stream" });
    }
}

module.exports = {
    fetchBatches,
    fetchSubjects,
    fetchTopics,
    fetchVideoUrl
};
