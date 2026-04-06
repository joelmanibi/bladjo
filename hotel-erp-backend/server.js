'use strict';

require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/database');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);

// ─── GRACEFUL SHUTDOWN ───────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('🔒  HTTP server closed.');
    process.exit(0);
  });

  // Force-exit after 10 s if connections are still open
  setTimeout(() => {
    console.error('❌  Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ─── UNHANDLED ERRORS ────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('❌  Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌  Uncaught Exception:', error);
  process.exit(1);
});

// ─── BOOT ────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  server.listen(PORT, HOST, () => {
    console.log('─────────────────────────────────────────');
    console.log(`🚀  Hotel ERP API started`);
    console.log(`📡  Listening on http://${HOST}:${PORT}`);
    console.log(`🌍  Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log('─────────────────────────────────────────');
  });
};

start();

