require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const userRoutes = require("./routers/userRoutes");
const ksRoutes = require("./routers/cardSamplingRoutes");
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
    origin: process.env.FRONTEND_URL, // frontend URL
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
