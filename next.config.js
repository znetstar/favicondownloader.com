const path = require('path');
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [
      path.join(__dirname, 'styles')
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        child_process: false
      }
      config.externals = {
        ...config.externals,
        'xxhash-addon': 'commonjs xxhash-addon',
        'bson-ext': 'commonjs bson-ext',
        'shelljs': 'commonjs shelljs',
        'lzma-native': 'commonjs lzma-native',
        'sharp': 'commonjs sharp',
        "lodepng": "commonjs lodepng."
      }
      config.plugins = [
        ...config.plugins,
        new (require('node-polyfill-webpack-plugin'))()
      ]
    }
    return config;
  }
}
