require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const userRoutes = require("./routers/userRoutes");
const ksRoutes = require("./routers/cardSamplingRoutes");
const raman = require("./routers/identificationRamanRoutes");
const rateLimitRoutes = require("./routers/rateLimitRoutes");
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

// IMPORT RATE LIMITER COMPONENTS
const { 
  loginRateLimiter, 
  dynamicRateLimiter, 
  blockCheckMiddleware,
  createManagementRoutes 
} = require("./middleware/rateLimiter");

// Import auth middleware
const { verifyToken } = require("./middleware/auth");

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

//CORS Middleware
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

// Basic Middleware
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());

// Socket.io setup
app.set("io", io);

// Static File Middleware
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// STEP 1: Apply login rate limiter to login endpoints FIRST
// CRITICAL: TAMBAH blockCheckMiddleware ke login routes juga!
app.use("/users/login", blockCheckMiddleware);  // TAMBAH INI!
app.use("/users/login", loginRateLimiter);
app.use("/users/register", blockCheckMiddleware);  // TAMBAH INI!
app.use("/users/register", loginRateLimiter);

// STEP 2: Apply token verification untuk protected routes
// Semua routes kecuali yang public perlu authentication
app.use("/users/*", (req, res, next) => {
  // Skip untuk login dan register
  if (req.path === "/login" || req.path === "/register") {
    return next();
  }
  verifyToken(req, res, next);
});

app.use("/cards/*", verifyToken);
app.use("/api/*", verifyToken);
app.use("/Raman/*", verifyToken);
app.use("/dashboardRMPM/*", verifyToken);
app.use("/homeEditing/*", verifyToken);
app.use("/admin/*", verifyToken);

// STEP 3: CRITICAL - Apply block check middleware SETELAH verifyToken
// Ini akan mencegah user yang diblok mengakses sistem
app.use("/users/*", (req, res, next) => {
  if (req.path === "/login" || req.path === "/register") {
    return next();
  }
  blockCheckMiddleware(req, res, next);
});

app.use("/cards/*", blockCheckMiddleware);
app.use("/api/*", blockCheckMiddleware);
app.use("/Raman/*", blockCheckMiddleware);
app.use("/dashboardRMPM/*", blockCheckMiddleware);
app.use("/homeEditing/*", blockCheckMiddleware);
app.use("/admin/*", blockCheckMiddleware);

// STEP 4: Apply dynamic rate limiter untuk protected routes
app.use("/users/*", (req, res, next) => {
  if (req.path === "/login" || req.path === "/register") {
    return next();
  }
  dynamicRateLimiter(req, res, next);
});

app.use("/cards/*", dynamicRateLimiter);
app.use("/api/*", dynamicRateLimiter);
app.use("/Raman/*", dynamicRateLimiter);
app.use("/dashboardRMPM/*", dynamicRateLimiter);
app.use("/homeEditing/*", dynamicRateLimiter);
app.use("/admin/*", dynamicRateLimiter);

// ENHANCED: Logging middleware untuk monitoring blocked users
app.use((req, res, next) => {
  // Log blocked user attempts dengan detail lebih baik
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
    if (token) {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { isUserBlocked } = require("./middleware/rateLimiter");

      if (isUserBlocked(decoded.id)) {
        console.log(
          `⚠️  BLOCKED USER ATTEMPT - User: ${decoded.email} (ID: ${decoded.id}) - ${req.method} ${req.path} - IP: ${req.ip} - Time: ${new Date().toISOString()}`
        );
        
        // Optional: Log ke file atau database untuk audit trail
        // logBlockedAttempt(decoded.id, decoded.email, req.method, req.path, req.ip);
      }
    }
  } catch (err) {
    // Ignore errors dalam logging, jangan block request
  }

  next();
});

// STEP 5: Setup admin management routes untuk block/unblock
// Ini akan membuat routes seperti /admin/blocked-status, /admin/block-user, etc.
createManagementRoutes(app);

// STEP 6: Apply routes - urutan ini penting setelah semua middleware
app.use("/users", userRoutes);
app.use("/cards", ksRoutes);
app.use("/api", uploadRoute);
app.use("/Raman", raman);
app.use("/dashboardRMPM", rmpmRoutes);
app.use("/homeEditing", HomePages);
app.use("/bot", bot);

// Rate limit management routes - ini mungkin duplikat dengan createManagementRoutes
// Bisa dihapus jika sudah menggunakan createManagementRoutes
app.use("/admin", rateLimitRoutes);

// ENHANCED: Handle rate limit errors
app.use((err, req, res, next) => {
  if (err.status === 429) {
    console.log(`🚫 Rate limit error: ${err.message} - User: ${req.user?.email || 'anonymous'} - IP: ${req.ip}`);
    
    return res.status(429).json({
      error: err.message || 'Too many requests',
      retryAfter: err.retryAfter || 60000,
      blocked: true,
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
});

// Handle multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("file")) {
    console.error('File upload error:', err.message);
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Handle 404 Not Found
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.path} - IP: ${req.ip}`);
  res.status(404).json({ 
    error: "Route not found",
    path: req.path,
    method: req.method 
  });
});

// Handle Server Errors
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  // Jangan expose error details di production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({ 
    error: "Internal Server Error",
    ...(isDevelopment && { details: err.message, stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
  console.log(`🔒 Rate limiting dan blocking system aktif`);
  console.log(`🌐 CORS origin: ${process.env.FRONTEND_URL}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log middleware yang aktif
  console.log(`📋 Active middleware:`);
  console.log(`   ✅ Block Check Middleware: SEMUA ROUTES (termasuk login)`);
  console.log(`   ✅ Login Rate Limiter: /users/login, /users/register`);
  console.log(`   ✅ Token Verification: All protected routes`);
  console.log(`   ✅ Dynamic Rate Limiter: All protected routes`);
  console.log(`   ✅ Admin Management Routes: /admin/blocked-status, /admin/block-user, etc.`);
});

/*
PERBAIKAN UTAMA:

1. TAMBAH blockCheckMiddleware ke login routes:
   - app.use("/users/login", blockCheckMiddleware);
   - app.use("/users/register", blockCheckMiddleware);

2. Ini akan mencegah user yang diblok untuk login sama sekali

3. Pastikan middleware/rateLimiter.js export fungsi dengan nama yang benar

4. Controller sudah diperbaiki untuk import yang benar

URUTAN MIDDLEWARE UNTUK LOGIN:
1. blockCheckMiddleware (cek apakah user/IP diblok)
2. loginRateLimiter (rate limit login attempts)

UNTUK ROUTES LAINNYA:
1. verifyToken (authentication)
2. blockCheckMiddleware (cek block status)
3. dynamicRateLimiter (rate limit API calls)
*/