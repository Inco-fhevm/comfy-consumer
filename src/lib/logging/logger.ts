// src/lib/logging/logger.ts
import winston from "winston";
import { hostname } from "os";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level (for console output)
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Create formatters
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for local development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} ${info.level}: ${info.message}` +
      (info.stack ? `\n${info.stack}` : "") +
      (Object.keys(info).length > 3
        ? `\n${JSON.stringify(
            Object.fromEntries(
              Object.entries(info).filter(
                ([key]) =>
                  !["timestamp", "level", "message", "stack"].includes(key)
              )
            ),
            null,
            2
          )}`
        : "")
  )
);

// Define which transports to use (console-only as requested)
const transports: winston.transport[] = [];

// Console transport
if (process.env.NODE_ENV !== "production") {
  // Development: Pretty console output
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  // Production: JSON output for log aggregators
  transports.push(
    new winston.transports.Console({
      format: winston.format.json(),
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  levels,
  format,
  defaultMeta: {
    service: process.env.SERVICE_NAME || "comfy-consumer",
    hostname: hostname(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.APP_VERSION || "1.0.0",
  },
  transports,
  exitOnError: false,
});

export default logger;
