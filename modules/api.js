import fetch from "node-fetch";

const API_BASE = process.env.API_BASE || "rozgarapinew.teachx.in";

// Helper to make secure API requests
async function makeApiRequest(endpoint, bodyData = {}) {
    try {
        const response = await fetch(`https://${API_BASE}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            body: JSON.stringify(bodyData)
        });
        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        return { success: false, message: error.message };
    }
}

export async function fetchBatches(req, res) {
    const data = await makeApiRequest("get_batches", req.body);
    res.json(data.data || data);
}

export async function fetchSubjects(req, res) {
    const { batch_id } = req.body;
    const data = await makeApiRequest("get_subjects", { batch_id });
    res.json(data.data || data);
}

export async function fetchTopics(req, res) {
    const { subject_id } = req.body;
    const data = await makeApiRequest("get_topics", { subject_id });
    res.json(data.data || data);
}

export async function fetchVideoUrl(req, res) {
    const { course_id, video_id, token, userid } = req.body;
    const data = await makeApiRequest("fetch_video", { course_id, video_id, token, userid });
    
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
