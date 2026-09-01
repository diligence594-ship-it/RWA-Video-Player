const express = require("express");
const cors = require("cors");
const { proxyStream } = require("./modules/api");

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy Endpoint Route Setup
app.options("/api/proxy", cors());
app.get("/api/proxy", proxyStream);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
