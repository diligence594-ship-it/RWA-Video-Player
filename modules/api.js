const fetch = require("node-fetch");

const API_BASE = process.env.API_BASE || "rozgarapinew.teachx.in";
const USER_TOKEN = process.env.APPX_TOKEN || "";
const USER_ID = process.env.APPX_USERID || "4300255";
const PROXY_BASE = "https://appx-sign-urls-g-483856624945.herokuapp.com";

// Helper function to query via Heroku Proxy Router
async function fetchViaProxy(action, params = {}) {
    const queryParams = new URLSearchParams({
        api_base: API_BASE,
        token: USER_TOKEN,
        userid: USER_ID,
        ...params
    });

    const url = `${PROXY_BASE}/${action}?${queryParams.toString()}`;

    try {
        const response = await fetch(url);
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error(`Proxy [${action}] non-JSON response:`, text.substring(0, 100));
            return { success: false };
        }
    } catch (err) {
        console.error(`Proxy Fetch Error [${action}]:`, err.message);
        return { success: false };
    }
}

async function fetchBatches(req, res) {
    // Attempt proxy fetch for batches/courses
    const data = await fetchViaProxy("get_batches", { path: "get/mycourses" });
    const batchList = data.data || data.courses || data.result || [];
    res.json(batchList);
}

async function fetchSubjects(req, res) {
    const { batch_id } = req.body;
    const data = await fetchViaProxy("get_subjects", { course_id: batch_id, path: "get/subjectbycourse" });
    const subjectList = data.data || data.subjects || data.result || [];
    res.json(subjectList);
}

async function fetchTopics(req, res) {
    const { subject_id } = req.body;
    const data = await fetchViaProxy("get_topics", { subject_id: subject_id, path: "get/topicbysubject" });
    const topicList = data.data || data.topics || data.result || [];
    res.json(topicList);
}

async function fetchVideoUrl(req, res) {
    const { course_id, video_id } = req.body;

    const data = await fetchViaProxy("fetch_video", {
        course_id: course_id || "424",
        video_id: video_id || "284152"
    });

    if (data && (data.data || data.video_url || data.link)) {
        const videoObj = data.data || data;
        res.json({
            success: true,
            video_url: videoObj.video_url || videoObj.stream_url || videoObj.link,
            pdf_url: videoObj.pdf_url || null
        });
    } else {
        res.status(400).json({ success: false, message: "Stream extraction failed" });
    }
}

module.exports = {
    fetchBatches,
    fetchSubjects,
    fetchTopics,
    fetchVideoUrl
};
