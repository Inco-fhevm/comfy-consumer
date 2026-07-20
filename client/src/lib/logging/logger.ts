import winston from "winston";
import { hostname } from "os";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

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

// Console-only transports
const transports: winston.transport[] = [];

if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.json(),
    })
  );
}

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
