module.exports = {
    apps: [
      {
        name: "qc", // Ganti dengan nama aplikasi Anda
        script: "index.js", // Ganti dengan nama file utama backend Anda
        watch: true,
        ignore_watch: ["node_modules"],
        autorestart: true,
        cron_restart: "0 */1 * * *", // Setiap 1 jam
        env: {
          NODE_ENV: "production",
        },
      },
    ],
  };
  