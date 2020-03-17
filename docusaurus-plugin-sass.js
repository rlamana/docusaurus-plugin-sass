module.exports = function() {
  return {
    name: 'docusaurus-plugin-sass',
    configureWebpack(_, isServer, utils) {
      const { getStyleLoaders } = utils;
      const isProd = process.env.NODE_ENV === 'production';
      return {
        module: {
          rules: [{
            test: /\.scss$/,
            oneOf: [{
              test: /\.module\.scss$/,
              use: [
                ...getStyleLoaders(isServer, {
                  modules: {
                    localIdentName: isProd
                      ? `[local]_[hash:base64:4]`
                      : `[local]_[path]`,
                  },
                  importLoaders: 1,
                  sourceMap: !isProd,
                  onlyLocals: isServer,
                }),
                'sass-loader'
              ]
            }, {
              use: [
                ...getStyleLoaders(isServer),
                'sass-loader'
              ]
            }]
          }]
        }
      };
    }
  };
};