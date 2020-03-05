module.exports = function() {
  return {
    name: 'docusaurus-plugin-sass',
    configureWebpack() {
      return {
        module: {
          rules: [
            {
              test: /\.s[ac]ss$/i,
              use: [
                'style-loader',
                'css-loader',
                'sass-loader',
              ]
            }
          ]
        }
      };
    }
  };
};