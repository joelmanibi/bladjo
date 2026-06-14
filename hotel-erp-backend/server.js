'use strict';

require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

logger.ensureLogsDir();

const server = http.createServer(app);

// ─── GRACEFUL SHUTDOWN ───────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force-exit after 10 s if connections are still open
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ─── UNHANDLED ERRORS ────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: String(reason), stack: reason?.stack });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

// ─── BOOT ────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  server.listen(PORT, HOST, () => {
    logger.info('Hotel ERP API started', {
      host: HOST,
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      logsDir: logger.logsDir,
    });
  });
};

start();

