// PM2 process file for running the production server on a VPS.
// Usage: npm run build && pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "honeybee",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "800M",
      env: { NODE_ENV: "production" },
    },
  ],
};
