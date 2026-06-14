'use strict';

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');

const ensureLogsDir = () => {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
};

const appendLine = (fileName, line) => {
  ensureLogsDir();
  fs.appendFileSync(path.join(logsDir, fileName), `${line}\n`, 'utf8');
};

const serializeMeta = (meta) => {
  if (!meta) return '';
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch (_) {
    return ' {"meta":"unserializable"}';
  }
};

const write = (level, message, meta = null) => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${level.toUpperCase()} ${message}${serializeMeta(meta)}`;

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);

  appendLine('app.log', line);
  if (level === 'error') appendLine('error.log', line);
};

const info = (message, meta) => write('info', message, meta);
const warn = (message, meta) => write('warn', message, meta);
const error = (message, meta) => write('error', message, meta);

const access = (meta) => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ACCESS ${JSON.stringify(meta)}`;
  console.log(line);
  appendLine('access.log', line);
  appendLine('app.log', line);
};

module.exports = {
  ensureLogsDir,
  info,
  warn,
  error,
  access,
  logsDir,
};