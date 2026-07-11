module.exports = {
  apps: [
    {
      name: "website-backend",
      script: "./node_modules/.bin/tsx",
      args: "server.ts",
      cwd: "./",
      instances: 1, // Change to 'max' if you want to cluster across multiple CPU cores
      exec_mode: "fork", // Use 'cluster' if instances > 1
      watch: false, // Set to true only in development
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      restart_delay: 3000,
      exp_backoff_restart_delay: 100
    }
  ]
};
