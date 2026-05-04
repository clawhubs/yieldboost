module.exports = {
  apps: [
    {
      name: "yieldboost",
      cwd: "/opt/yieldboost/current",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 3000",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      max_restarts: 10,
      restart_delay: 3000,
      time: true,
    },
  ],
};
