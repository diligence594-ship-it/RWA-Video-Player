const fetch = require("node-fetch");
const crypto = require("crypto");

const API_BASE = process.env.API_BASE || "rozgarapinew.teachx.in";
const USER_TOKEN = process.env.APPX_TOKEN || "";
const USER_ID = process.env.APPX_USERID || "4300255";

const AES_KEY = Buffer.from("638udh3829162018", "utf-8");[cite: 1, 2, 3, 4]
const AES_IV = Buffer.from("fedcba9876543210", "utf-8");[cite: 1, 2, 3, 4]

function decryptAppx(encryptedText) {
    if (!encryptedText) return "";
    try {
        const cleanEnc = encryptedText.split("*")[0].split(":")[0];
        const encryptedBytes = Buffer.from(cleanEnc, "base64");
        
        const decipher = crypto.createDecipheriv("aes-128-cbc", AES_KEY, AES_IV);
        decipher.setAutoPadding(true);
        
        let decrypted = decipher.update(encryptedBytes, null, "utf-8");
        decrypted += decipher.final("utf-8");
        return decrypted.trim();
    } catch (err) {
        return encryptedText;
    }
}

function getHeaders() {
    return {
        "Client-Service": "Appx",
        "Auth-Key": "appxapi",
        "Authorization": USER_TOKEN,
        "User-ID": USER_ID,
        "User-Agent": "okhttp/4.9.1",
        "Content-Type": "application/json"
    };
}

// 1. Fetch Batches with Proper Field Mapping
async function fetchBatches(req, res) {
    try {
        const url = `https://${API_BASE}/get/mycoursev2?userid=${USER_ID}`;
        const response = await fetch(url, { headers: getHeaders() });
        const data = await response.json();
        
        const rawCourses = data.data || [];
        
        // Frontend support ke liye standard structure map kar rahe hain
        const formattedBatches = rawCourses.map(item => ({
            id: item.id || item.course_id || item.courseid,
            name: item.course_name || item.title || item.name || "Untitled Batch",
            image: item.cover_image || item.image || ""
        }));

        res.json(formattedBatches);
    } catch (err) {
        console.error("Batches Fetch Error:", err.message);
        res.json([]);
    }
}

// 2. Fetch Subjects
async function fetchSubjects(req, res) {
    const { batch_id } = req.body;
    try {
        const url = `https://${API_BASE}/get/allsubjectfrmlivecourseclass?courseid=${batch_id}&start=-1`;
        const response = await fetch(url, { headers: getHeaders() });
        const data = await response.json();
        
        const rawSubjects = data.data || [];
        const formattedSubjects = rawSubjects.map(item => ({
            id: item.id || item.subject_id || item.subjectid,
            name: item.subject_name || item.name || "Subject"
        }));

        res.json(formattedSubjects);
    } catch (err) {
        console.error("Subjects Fetch Error:", err.message);
        res.json([]);
    }
}

// 3. Fetch Topics
async function fetchTopics(req, res) {
    const { course_id, subject_id } = req.body;
    try {
        const url = `https://${API_BASE}/get/alltopicfrmlivecourseclass?courseid=${course_id}&subjectid=${subject_id}&start=-1`;
        const response = await fetch(url, { headers: getHeaders() });
        const data = await response.json();
        
        const rawTopics = data.data || [];
        const formattedTopics = rawTopics.map(item => ({
            id: item.id || item.topic_id || item.topicid,
            name: item.topic_name || item.name || "Topic",
            video_id: item.video_id || item.id
        }));

        res.json(formattedTopics);
    } catch (err) {
        console.error("Topics Fetch Error:", err.message);
        res.json([]);
    }
}

// 4. Fetch Decrypted Video URL
async function fetchVideoUrl(req, res) {
    const { course_id, video_id } = req.body;
    try {
        const url = `https://${API_BASE}/get/fetchVideoDetailsById?course_id=${course_id}&video_id=${video_id}&ytflag=0&folder_wise_course=0`;[cite: 1, 2, 3, 4]
        const response = await fetch(url, { headers: getHeaders() });
        const resData = await response.json();

        if (resData && resData.data) {
            const data = resData.data;
            let finalStreamUrl = "";

            if (data.download_link) {[cite: 1, 2, 3, 4]
                finalStreamUrl = decryptAppx(data.download_link);
            } else if (data.encrypted_links && data.encrypted_links.length > 0) {[cite: 1, 2, 3, 4]
                const path = data.encrypted_links[0].path;[cite: 1, 2, 3, 4]
                if (path) finalStreamUrl = decryptAppx(path);
            }

            let pdfUrl = data.pdf_link ? decryptAppx(data.pdf_link) : "";

            return res.json({
                success: true,
                video_url: finalStreamUrl,
                pdf_url: pdfUrl
            });
        }

        res.status(400).json({ success: false, message: "No stream data found" });
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
