module.exports = function() {
  return {
    name: 'docusaurus-plugin-sass',
    configureWebpack(_, isServer, utils) {
      const { getStyleLoaders, getCacheLoader } = utils;
      return {
        module: {
          rules: [
            {
              test: /\.s[ac]ss$/i,
              use: [
                getCacheLoader(isServer),
                ...getStyleLoaders(isServer),
                'sass-loader',
              ]
            }
          ]
        }
      };
    }
  };
};