const fetch = require("node-fetch");
const axios = require("axios");
const crypto = require("crypto");

const API_BASE = process.env.API_BASE || "rozgarapinew.teachx.in";
const DEFAULT_USER_TOKEN = process.env.APPX_TOKEN || "";
const DEFAULT_USER_ID = process.env.APPX_USERID || "4300255";

const AES_KEY = Buffer.from("638udh3829162018", "utf-8");
const AES_IV = Buffer.from("fedcba9876543210", "utf-8");

// AppX Custom Headers for CDN & API
const REFERER = "https://appx-play.akamai.net.in/";
const ORIGIN  = "https://appx-play.akamai.net.in";
const HOST    = "static-trans-v1.appx.co.in";

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

// First 28-byte XOR Decryption function for AppX Encrypted Streams
function decrypt28(buf, key) {
    if (!key || buf.length < 28) return;
    for (let i = 0; i < 28; i++) {
        buf[i] ^= (i < key.length ? key.charCodeAt(i) : i);
    }
}

function getHeaders(token, userId) {
    return {
        "Client-Service": "Appx",
        "Auth-Key": "appxapi",
        "Authorization": token || DEFAULT_USER_TOKEN,
        "User-ID": userId || DEFAULT_USER_ID,
        "User-Agent": "okhttp/4.9.1",
        "source": "website"
    };
}

async function fetchBatches(req, res) {
    const { token, user_id } = req.body;
    const uid = user_id || DEFAULT_USER_ID;
    try {
        const url = `https://${API_BASE}/get/mycoursev2?userid=${uid}`;
        const response = await fetch(url, { headers: getHeaders(token, uid) });
        const data = await response.json();
        const rawCourses = data.data || [];
        const formattedBatches = rawCourses.map(item => ({
            id: String(item.id || item.course_id || item.courseid),
            name: item.course_name || item.title || item.name || "Untitled Batch"
        }));
        res.json(formattedBatches);
    } catch (err) {
        console.error("Batches Fetch Error:", err.message);
        res.json([]);
    }
}

async function fetchSubjects(req, res) {
    const { batch_id, token, user_id } = req.body;
    try {
        const url = `https://${API_BASE}/get/allsubjectfrmlivecourseclass?courseid=${batch_id}&start=-1`;
        const response = await fetch(url, { headers: getHeaders(token, user_id) });
        const data = await response.json();
        const rawSubjects = data.data || [];
        const formattedSubjects = rawSubjects.map(item => ({
            id: String(item.subjectid || item.id || item.subject_id),
            name: item.subject_name || item.name || "Subject"
        }));
        res.json(formattedSubjects);
    } catch (err) {
        console.error("Subjects Fetch Error:", err.message);
        res.json([]);
    }
}

async function fetchTopics(req, res) {
    const { course_id, subject_id, token, user_id } = req.body;
    try {
        const url = `https://${API_BASE}/get/alltopicfrmlivecourseclass?courseid=${course_id}&subjectid=${subject_id}&start=-1`;
        const response = await fetch(url, { headers: getHeaders(token, user_id) });
        const data = await response.json();
        const rawTopics = data.data || [];
        const formattedTopics = rawTopics.map(item => ({
            id: String(item.topicid || item.id || item.topic_id),
            name: item.topic_name || item.name || item.title || "Topic"
        }));
        res.json(formattedTopics);
    } catch (err) {
        console.error("Topics Fetch Error:", err.message);
        res.json([]);
    }
}

async function fetchLectures(req, res) {
    const { course_id, subject_id, topic_id, token, user_id } = req.body;
    try {
        let rawVideos = [];
        const headers = getHeaders(token, user_id);

        let url1 = `https://${API_BASE}/get/livecourseclassbycoursesubtopconceptapiv3?courseid=${course_id}&subjectid=${subject_id}&topicid=${topic_id}&conceptid=&start=-1`;
        let res1 = await fetch(url1, { headers });
        let data1 = await res1.json();
        if (data1.data && data1.data.length > 0) rawVideos = data1.data;

        if (rawVideos.length === 0) {
            let url2 = `https://${API_BASE}/get/livecourseclassbycoursesubtopconceptapiv3?courseid=${course_id}&subjectid=${subject_id}&topicid=&conceptid=${topic_id}&start=-1`;
            let res2 = await fetch(url2, { headers });
            let data2 = await res2.json();
            if (data2.data && data2.data.length > 0) rawVideos = data2.data;
        }

        const formattedVideos = rawVideos.map((item, idx) => ({
            id: String(item.id || item.video_id || item.v_id || idx),
            name: item.title || item.name || item.video_title || `Lecture ${idx + 1}`
        }));

        res.json(formattedVideos);
    } catch (err) {
        console.error("Lectures Fetch Error:", err.message);
        res.json([]);
    }
}

async function fetchVideoUrl(req, res) {
    const { course_id, video_id, token, user_id } = req.body;
    const reqToken = token || DEFAULT_USER_TOKEN;
    const reqUserId = user_id || DEFAULT_USER_ID;

    try {
        const url = `https://${API_BASE}/get/fetchVideoDetailsById?course_id=${course_id}&video_id=${video_id}&ytflag=0&folder_wise_course=0`;
        const response = await fetch(url, { headers: getHeaders(reqToken, reqUserId) });
        const resData = await response.json();

        if (resData && resData.data) {
            const data = resData.data;
            let rawStreamUrl = "";
            let streamKey = "";

            if (data.video_id) {
                const decryptedVid = decryptAppx(data.video_id);
                if (decryptedVid && !decryptedVid.includes("http") && decryptedVid.length < 20) {
                    return res.json({
                        success: true,
                        video_url: `https://youtu.be/${decryptedVid}`,
                        is_youtube: true
                    });
                }
            }

            if (data.download_link) {
                rawStreamUrl = decryptAppx(data.download_link);
            } 
            
            if (!rawStreamUrl && data.encrypted_links && data.encrypted_links.length > 0) {
                const path = data.encrypted_links[0].path;
                const keyEnc = data.encrypted_links[0].key;
                if (path) rawStreamUrl = decryptAppx(path);
                if (keyEnc) streamKey = Buffer.from(decryptAppx(keyEnc), "base64").toString("utf-8");
            }

            let pdfUrl = data.pdf_link ? decryptAppx(data.pdf_link) : "";

            if (rawStreamUrl) {
                const queryAuth = `&token=${encodeURIComponent(reqToken)}&userid=${encodeURIComponent(reqUserId)}&key=${encodeURIComponent(streamKey)}`;
                const finalProxyUrl = `/api/proxy?url=${encodeURIComponent(rawStreamUrl)}${queryAuth}`;
                
                return res.json({
                    success: true,
                    video_url: finalProxyUrl,
                    raw_url: rawStreamUrl,
                    pdf_url: pdfUrl
                });
            }
        }

        res.status(400).json({ success: false, message: "No stream data found" });
    } catch (err) {
        console.error("Video Fetch Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
}

// PROXY WITH XOR-28 DECRYPTION AND AKAMAI ORIGIN HEADERS
async function proxyStream(req, res) {
    const videoUrl = req.query.url;
    const key = req.query.key || "";
    const reqToken = req.query.token || DEFAULT_USER_TOKEN;
    const reqUserId = req.query.userid || DEFAULT_USER_ID;

    if (!videoUrl) return res.status(400).send("No stream URL provided");

    const clientRange = req.headers.range || "bytes=0-";

    try {
        const upstream = await axios({
            method: "GET",
            url: videoUrl,
            responseType: "stream",
            headers: {
                "Referer": REFERER,
                "Origin": ORIGIN,
                "Host": HOST,
                "Range": clientRange,
                "User-Agent": "Mozilla/5.0 (Android)",
                "Client-Service": "Appx",
                "Auth-Key": "appxapi",
                "Authorization": reqToken,
                "User-ID": reqUserId
            },
            validateStatus: () => true
        });

        if (upstream.status === 403) {
            return res.status(403).send("Origin blocked by AppX CDN");
        }

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "*");

        if (req.method === "OPTIONS") return res.sendStatus(200);

        const contentType = upstream.headers["content-type"] || "";

        // If PlayList (.m3u8), rewrite segments with proxy URL
        if (videoUrl.includes(".m3u8") || contentType.includes("mpegurl")) {
            res.setHeader("Content-Type", "application/vnd.apple.mpegurl");

            let chunks = [];
            upstream.data.on("data", chunk => chunks.push(chunk));
            upstream.data.on("end", () => {
                let m3u8Text = Buffer.concat(chunks).toString("utf-8");
                const baseUrl = videoUrl.substring(0, videoUrl.lastIndexOf("/") + 1);
                const authParams = `&token=${encodeURIComponent(reqToken)}&userid=${encodeURIComponent(reqUserId)}&key=${encodeURIComponent(key)}`;

                const lines = m3u8Text.split(/\r?\n/);
                const rewrittenLines = lines.map(line => {
                    let trimmed = line.trim();
                    if (!trimmed) return line;

                    if (trimmed.startsWith("#EXT-X-KEY:")) {
                        return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
                            let absoluteUri = uri.startsWith("http") ? uri : new URL(uri, baseUrl).href;
                            return `URI="/api/proxy?url=${encodeURIComponent(absoluteUri)}${authParams}"`;
                        });
                    }

                    if (!trimmed.startsWith("#")) {
                        let absoluteSegmentUrl = trimmed.startsWith("http") ? trimmed : new URL(trimmed, baseUrl).href;
                        return `/api/proxy?url=${encodeURIComponent(absoluteSegmentUrl)}${authParams}`;
                    }

                    return line;
                });

                res.send(rewrittenLines.join("\n"));
            });
            return;
        }

        // For TS Video Chunks & MP4 (Decrypt first 28 bytes if key exists)
        res.status(upstream.status);
        res.setHeader("Content-Type", contentType || "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");

        if (upstream.headers["content-range"]) res.setHeader("Content-Range", upstream.headers["content-range"]);
        if (upstream.headers["content-length"]) res.setHeader("Content-Length", upstream.headers["content-length"]);

        // If Range request isn't start, stream directly
        if (!clientRange.startsWith("bytes=0") || !key) {
            return upstream.data.pipe(res);
        }

        let buffer = Buffer.alloc(0);
        let done = false;

        upstream.data.on("data", chunk => {
            if (!done) {
                buffer = Buffer.concat([buffer, chunk]);
                if (buffer.length >= 28) {
                    decrypt28(buffer, key);
                    res.write(buffer);
                    done = true;
                }
            } else {
                res.write(chunk);
            }
        });

        upstream.data.on("end", () => res.end());
        upstream.data.on("error", () => res.end());

    } catch (err) {
        console.error("Stream Proxy Error:", err.message);
        res.status(500).send("Proxy Error: " + err.message);
    }
}

module.exports = {
    fetchBatches,
    fetchSubjects,
    fetchTopics,
    fetchLectures,
    fetchVideoUrl,
    proxyStream
};
