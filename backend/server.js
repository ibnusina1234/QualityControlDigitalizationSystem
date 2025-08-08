require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const userRoutes = require("./routers/userRoutes");
const ksRoutes = require("./routers/cardSamplingRoutes");
const raman = require("./routers/identificationRamanRoutes");
const rateLimitRoutes =require("./routers/rateLimitRoutes");
const HomePages = require("./routers/homePagesRoutes");
const bot = require("./routers/telegramBotRoutes");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const multer = require("multer");
const { google } = require("googleapis");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const uploadRoute = require("./routers/uploadRouter");
const scopes = ["https://www.googleapis.com/auth/drive.file"];
const rmpmRoutes = require("./routers/dashboardRMPMRoutes");

///Buat URL autentikasi Google
app.get("/auth/google", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline", // Meminta refresh token
    scope: scopes,
  });
  res.redirect(authUrl);
});

// Callback URL setelah pengguna memberi izin
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  try {
    // Tukar kode authorization dengan token akses
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Simpan token untuk digunakan di API
    res.send("Autentikasi berhasil! Kembali ke aplikasi.");
  } catch (error) {
    console.error("Error while exchanging code for tokens", error);
    res.status(500).send("Error during authentication");
  }
});

//Middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options(
  "*",
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use((req, res, next) => {
  if (req.path.startsWith("/admin/")) {
    return next();
  }

  // Log blocked user attempts tanpa blocking request
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { isUserBlocked } = require("./rateLimiter");

      if (isUserBlocked(decoded.id)) {
        console.log(
          `⚠️  Blocked user ${decoded.id} attempted: ${req.method} ${req.path}`
        );
      }
    }
  } catch (err) {
    // Ignore errors dalam logging
  }

  next();
});

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//socket.io
app.use(express.json());
app.use(cookieParser());

app.set("io", io);

// Static File Middleware
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Routes
app.use("/users", userRoutes);
app.use("/cards", ksRoutes);
app.use("/api", uploadRoute);
app.use("/Raman", raman);
app.use("/dashboardRMPM", rmpmRoutes);
app.use("/homeEditing", HomePages);
app.use("/bot", bot);

// Rate limit management routes - harus setelah middleware lain
app.use("/admin", rateLimitRoutes);

// Handle 404 Not Found
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Handle Server Errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("file")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
