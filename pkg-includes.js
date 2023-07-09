const fs = require('fs-extra');

fs.copySync('node_modules/opn/xdg-open', 'dist/xdg-open'); 
fs.copySync('node_modules/electron/dist', 'dist/electron');