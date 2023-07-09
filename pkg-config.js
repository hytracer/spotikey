module.exports = {
    targets: ['node14-linux-x64', 'node14-win-x64'],
    assets: ['**/*', '!dist', 'node_modules/**/*'],
    postbuild:'pkg-assets',
    scripts: 'dist/**/*.js',
  };
  