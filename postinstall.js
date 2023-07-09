const { exec } = require('child_process');
const path = require('path');

// Get the installation path
const installationPath = path.resolve(__dirname);

// Open the installation folder
exec(`start "" "${installationPath}"`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error opening installation folder: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Error opening installation folder: ${stderr}`);
    return;
  }

  // Open the README file
  exec(`start "" "${path.join(installationPath, 'POSTINSTALL.txt')}"`, (readmeError, readmeStdout, readmeStderr) => {
    if (readmeError) {
      console.error(`Error opening README file: ${readmeError.message}`);
      return;
    }
    if (readmeStderr) {
      console.error(`Error opening README file: ${readmeStderr}`);
      return;
    }
  });
});
