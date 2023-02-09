module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.target = "electron-main";
    }
    config.node = {
      fs: 'empty'
    }
    return config;
  },
}