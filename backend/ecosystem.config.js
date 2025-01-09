module.exports = {
  apps: [
    {
      name: "auth-flow-backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
      },
      log_file: "/var/log/pm2/auth-flow-backend.log",
      out_file: "/var/log/pm2/auth-flow-backend-out.log",
      error_file: "/var/log/pm2/auth-flow-backend-error.log",
    },
  ],
};
