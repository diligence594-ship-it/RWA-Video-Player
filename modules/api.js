const fetch = require("node-fetch");
const crypto = require("crypto");

const API_BASE = process.env.API_BASE || "rozgarapinew.teachx.in";
const USER_TOKEN = process.env.APPX_TOKEN || "";
const USER_ID = process.env.APPX_USERID || "4300255";

// AppX Standard Encryption Parameters Extracted From Source Code
const AES_KEY = Buffer.from("638udh3829162018", "utf-8");
const AES_IV = Buffer.from("fedcba9876543210", "utf-8");

// AppX AES Decrypter
function decryptAppx(encryptedText) {
    if (!encryptedText) return "";
    try {
        const cleanEnc = encryptedText.split(":")[0];
        const encryptedBytes = Buffer.from(cleanEnc, "base64");
        
        const decipher = crypto.createDecipheriv("aes-128-cbc", AES_KEY, AES_IV);
        decipher.setAutoPadding(true);
        
        let decrypted = decipher.update(encryptedBytes, null, "utf-8");
        decrypted += decipher.final("utf-8");
        return decrypted.trim();
    } catch (err) {
        console.error("AES Decryption Error:", err.message);
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

async function fetchBatches(req, res) {
    try {
        const url = `https://${API_BASE}/get/mycoursev2?userid=${USER_ID}`;
        const response = await fetch(url, { headers: getHeaders() });
        const data = await response.json();
        
        const courses = data.data || [];
        res.json(courses);
    } catch (err) {
        console.error("Batches Fetch Error:", err.message);
        res.json([]);
    }
}

async function fetchSubjects(req, res) {
    const { batch_id } = req.body;
    try {
        const url = `https://${API_BASE}/get/allsubjectfrmlivecourseclass?courseid=${batch_id}&start=-1`;
        const response = await fetch(url, { headers: getHeaders() });
        const data = await response.json();
        
        res.json(data.data || []);
    } catch (err) {
        console.error("Subjects Fetch Error:", err.message);
        res.json([]);
    }
}

async function fetchTopics(req, res) {
    const { course_id, subject_id } = req.body;
    try {
        const url = `https://${API_BASE}/get/alltopicfrmlivecourseclass?courseid=${course_id}&subjectid=${subject_id}&start=-1`;
        const response = await fetch(url, { headers: getHeaders() });
        const data = await response.json();
        
        res.json(data.data || []);
    } catch (err) {
        console.error("Topics Fetch Error:", err.message);
        res.json([]);
    }
}

async function fetchVideoUrl(req, res) {
    const { course_id, video_id } = req.body;
    try {
        const url = `https://${API_BASE}/get/fetchVideoDetailsById?course_id=${course_id}&video_id=${video_id}&ytflag=0&folder_wise_course=0`;
        const response = await fetch(url, { headers: getHeaders() });
        const resData = await response.json();

        if (resData && resData.data) {
            const data = resData.data;
            let finalStreamUrl = "";

            // 1. Direct Download Link Extraction
            if (data.download_link) {
                finalStreamUrl = decryptAppx(data.download_link);
            } 
            // 2. Encrypted Links Array Fallback
            else if (data.encrypted_links && data.encrypted_links.length > 0) {
                const path = data.encrypted_links[0].path;
                if (path) {
                    finalStreamUrl = decryptAppx(path);
                }
            }

            // 3. Extracted PDF Link (if present)
            let pdfUrl = "";
            if (data.pdf_link) {
                pdfUrl = decryptAppx(data.pdf_link);
            }

            return res.json({
                success: true,
                video_url: finalStreamUrl,
                pdf_url: pdfUrl
            });
        }

        res.status(400).json({ success: false, message: "No stream data found" });
    } catch (err) {
        console.error("Video Stream Extraction Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = {
    fetchBatches,
    fetchSubjects,
    fetchTopics,
    fetchVideoUrl
};
