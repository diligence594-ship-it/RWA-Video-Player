import fetch from "node-fetch";

const API_BASE = process.env.API_BASE || "rozgarapinew.teachx.in";

// 🔑 Apna Active User Token Aur User ID Yahan Set Karein
const USER_TOKEN = process.env.APPX_TOKEN || "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."; 
const USER_ID = process.env.APPX_USERID || "4300255";

async function makeApiRequest(endpoint, bodyData = {}) {
    try {
        const response = await fetch(`https://${API_BASE}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "token": USER_TOKEN,
                "authorization": USER_TOKEN,
                "userid": USER_ID
            },
            body: JSON.stringify({
                ...bodyData,
                token: USER_TOKEN,
                userid: USER_ID
            })
        });
        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        return { success: false, message: error.message };
    }
}

export async function fetchBatches(req, res) {
    const data = await makeApiRequest("get_batches", req.body);
    // Standard response array mapping
    const batchList = data.data || data.batches || data.result || [];
    res.json(batchList);
}

export async function fetchSubjects(req, res) {
    const { batch_id } = req.body;
    const data = await makeApiRequest("get_subjects", { batch_id });
    const subjectList = data.data || data.subjects || data.result || [];
    res.json(subjectList);
}

export async function fetchTopics(req, res) {
    const { subject_id } = req.body;
    const data = await makeApiRequest("get_topics", { subject_id });
    const topicList = data.data || data.topics || data.result || [];
    res.json(topicList);
}

export async function fetchVideoUrl(req, res) {
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
