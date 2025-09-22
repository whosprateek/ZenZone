const webpackFallbacks = {
  fs: false,
  url: false,
  http: false,
  https: false,
  child_process: false,
};

module.exports = {
  webpack: {
    configure: (config) => {
      config.resolve = config.resolve || {};
      config.resolve.fallback = { ...(config.resolve.fallback || {}), ...webpackFallbacks };
      return config;
    },
  },
};