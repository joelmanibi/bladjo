module.exports = {
  apps: [
    {
      name: 'bladjo-front',
      cwd: '/opt/bladjo/hotel-admin',
      script: 'npm',
      args: 'run preview -- --host 127.0.0.1 --port 4173',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '250M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'bladjo-api',
      cwd: '/opt/bladjo/hotel-erp-backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 3100,
      },
    },
  ],
};