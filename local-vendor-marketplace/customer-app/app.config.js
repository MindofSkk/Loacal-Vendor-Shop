const fs = require('fs');

const config = require('./app.json');

module.exports = () => {
  const expo = { ...config.expo };
  const android = { ...(expo.android || {}) };

  if (fs.existsSync('./google-services.json')) {
    android.googleServicesFile = './google-services.json';
  }

  return {
    ...expo,
    android
  };
};
