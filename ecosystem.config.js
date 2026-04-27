module.exports = {
  apps: [
    {
      name: 'nestjs_starter_pack',
      script: './dist/main.js',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
