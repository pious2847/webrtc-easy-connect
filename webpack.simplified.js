const path = require('path');

module.exports = {
  entry: './src/simplified-index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'webrtc-easy.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'WebRTCEasy',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
};
