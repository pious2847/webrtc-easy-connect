const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './dist/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'webrtc-easy.min.js',
    library: {
      name: 'WebRTCEasy',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
};
