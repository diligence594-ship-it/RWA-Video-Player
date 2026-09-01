const fetch = require('node-fetch'); // Node 18+ me global fetch built-in hota h

// Base AppX Headers Setup
const APPX_HEADERS = {
    "Client-Service": "Appx",
    "Auth-Key": "appxapi",
    "User-Agent": "okhttp/4.9.1",
    "source": "website"
};

async function proxyStream(req, res) {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send("No stream URL provided");

    try {
        // AppX User Token & ID headers pass karein
        const requestHeaders = {
            ...APPX_HEADERS,
            "Authorization": req.headers['authorization'] || "",
            "User-ID": req.headers['user-id'] || ""
        };

        const response = await fetch(videoUrl, { headers: requestHeaders });
        const contentType = response.headers.get("content-type") || "";

        // CORS Headers set karein taaki frontend me browser block na kare
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");

        if (videoUrl.includes(".m3u8")) {
            res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
            let m3u8Text = await response.text();

            // Original Signed Query Parameters (Tokens/Signature) extract karein
            const urlObj = new URL(videoUrl);
            const baseUrl = videoUrl.substring(0, videoUrl.lastIndexOf("/") + 1);
            const searchParams = urlObj.search; 

            // Line-by-line M3U8 rewrite logic
            const rewrittenM3u8 = m3u8Text.split("\n").map(line => {
                line = line.trim();
                if (line.length > 0 && !line.startsWith("#")) {
                    let fullSegmentUrl = "";
                    
                    if (line.startsWith("http://") || line.startsWith("https://")) {
                        fullSegmentUrl = line;
                    } else {
                        // Relative path ko Base URL + Signed Parameters ke sath combine karein
                        const cleanLine = line.split("?")[0];
                        fullSegmentUrl = baseUrl + cleanLine + searchParams;
                    }
                    
                    // Route via Backend Proxy
                    return `/api/proxy?url=${encodeURIComponent(fullSegmentUrl)}`;
                }
                return line;
            }).join("\n");

            return res.send(rewrittenM3u8);
        } else {
            // Binary Video Chunks (.ts)
            if (contentType) res.setHeader("Content-Type", contentType);
            const arrayBuffer = await response.arrayBuffer();
            return res.send(Buffer.from(arrayBuffer));
        }
    } catch (err) {
        console.error("Stream Proxy Error:", err.message);
        res.status(500).send("Proxy Error: " + err.message);
    }
}

module.exports = { proxyStream };
