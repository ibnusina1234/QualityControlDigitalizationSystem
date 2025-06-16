// utils/logger.js
const winston = require("winston");

const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: "info", // Default log level
  format: winston.format.combine(winston.format.timestamp(), logFormat),
  transports: [
    new winston.transports.Console(), // Output ke console
    new winston.transports.File({ filename: "logs/app.log" }), // Output ke file logs/app.log
  ],
});

module.exports = logger;
