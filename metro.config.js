const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Windows'ta dosya değişikliklerinin algılanması için polling aktif
config.watchFolders = [__dirname];
config.watcher = {
  watchman: {
    deferStates: ['hg.update'],
  },
  healthCheck: {
    enabled: true,
  },
};

module.exports = config;
