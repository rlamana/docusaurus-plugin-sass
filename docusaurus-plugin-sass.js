module.exports = function() {
  return {
    name: 'docusaurus-plugin-sass',
    configureWebpack(_, isServer, utils) {
      const { getStyleLoaders } = utils;
      return {
        module: {
          rules: [
            {
              test: /\.s[ac]ss$/i,
              use: [
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