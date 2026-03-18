module.exports = {
  apps: [
    {
      name: "pure-therapeutic-art",
      script: "server.cjs",
      cwd: "/var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current",
      env_file: ".env.production",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "750M",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: 3000,
      },
    },
  ],
};
