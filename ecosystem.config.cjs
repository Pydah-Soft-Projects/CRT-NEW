const path = require('path');

module.exports = {
  apps: [
    {
      name: 'crt-backend',
      cwd: path.resolve(__dirname, 'backend'),
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      node_args: '--max-old-space-size=200',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_file: path.resolve(__dirname, 'backend/.env'),
      error_file: path.resolve(__dirname, 'logs/backend-error.log'),
      out_file: path.resolve(__dirname, 'logs/backend-out.log'),
      merge_logs: true,
      time: true
    },
    {
      name: 'crt-frontend',
      cwd: path.resolve(__dirname, 'frontend'),
      script: 'serve',
      env: {
        PM2_SERVE_PATH: path.resolve(__dirname, 'frontend/dist') + '/',
        PM2_SERVE_PORT: 3000,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      error_file: path.resolve(__dirname, 'logs/frontend-error.log'),
      out_file: path.resolve(__dirname, 'logs/frontend-out.log'),
      merge_logs: true,
      time: true
    }
  ]
};
