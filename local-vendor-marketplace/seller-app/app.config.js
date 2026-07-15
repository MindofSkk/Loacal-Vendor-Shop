const fs = require('fs');

module.exports = ({ config }) => {
  const android = { ...(config.android || {}) };

  if (fs.existsSync('./google-services.json')) {
    android.googleServicesFile = './google-services.json';
  }

  return {
    ...config,
    android
  };
};
