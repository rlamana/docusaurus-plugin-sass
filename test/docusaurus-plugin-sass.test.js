const test = require('node:test');
const assert = require('node:assert/strict');
const pluginFactory = require('../docusaurus-plugin-sass.js');

function withNodeEnv(value, fn) {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = value;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prev;
  }
}

function makeUtils(t) {
  return {
    getStyleLoaders: t.mock.fn((isServer, opts) => ([
      { loader: 'style-loader-mock', options: opts, isServer }
    ]))
  };
}

function getRules(pluginOptions, isServer, utils) {
  const plugin = pluginFactory(null, pluginOptions || {});
  const config = plugin.configureWebpack(null, isServer, utils);
  const [moduleBranch, plainBranch] = config.module.rules[0].oneOf;
  return { moduleBranch, plainBranch };
}

test('exposes the plugin name and a configureWebpack hook', () => {
  const plugin = pluginFactory(null, {});
  assert.equal(plugin.name, 'docusaurus-plugin-sass');
  assert.equal(typeof plugin.configureWebpack, 'function');
});

test('matches .sass and .scss files, routing *.module.s[ca]ss separately', () => {
  const plugin = pluginFactory(null, {});
  const config = plugin.configureWebpack(null, false, makeUtils({ mock: { fn: (i) => i } }));
  const rule = config.module.rules[0];
  assert.equal(rule.test.source, /\.s[ca]ss$/.source);
  assert.equal(rule.oneOf[0].test.source, /\.module\.s[ca]ss$/.source);
  assert.equal(rule.oneOf[1].test, undefined);
});

test('development: requests source maps from both the css and sass loaders', (t) => {
  withNodeEnv('development', () => {
    const utils = makeUtils(t);
    const { moduleBranch, plainBranch } = getRules({}, false, utils);

    const [moduleStyleCall, plainStyleCall] = utils.getStyleLoaders.mock.calls;
    assert.equal(moduleStyleCall.arguments[1].sourceMap, true);
    assert.equal(plainStyleCall.arguments[1].sourceMap, true);

    const moduleSassLoader = moduleBranch.use.at(-1);
    const plainSassLoader = plainBranch.use.at(-1);
    assert.equal(moduleSassLoader.loader, require.resolve('sass-loader'));
    assert.equal(moduleSassLoader.options.sourceMap, true);
    assert.equal(plainSassLoader.options.sourceMap, true);
  });
});

test('production: disables source maps and hashes CSS module class names', (t) => {
  withNodeEnv('production', () => {
    const utils = makeUtils(t);
    const { moduleBranch, plainBranch } = getRules({}, false, utils);

    const [moduleStyleCall, plainStyleCall] = utils.getStyleLoaders.mock.calls;
    assert.equal(moduleStyleCall.arguments[1].sourceMap, false);
    assert.equal(plainStyleCall.arguments[1].sourceMap, false);
    assert.equal(moduleStyleCall.arguments[1].modules.localIdentName, '[local]_[hash:base64:4]');

    assert.equal(moduleBranch.use.at(-1).options.sourceMap, false);
    assert.equal(plainBranch.use.at(-1).options.sourceMap, false);
  });
});

test('development: keeps readable CSS module class names', (t) => {
  withNodeEnv('development', () => {
    const utils = makeUtils(t);
    const { moduleBranch } = getRules({}, false, utils);
    const [moduleStyleCall] = utils.getStyleLoaders.mock.calls;
    assert.equal(moduleStyleCall.arguments[1].modules.localIdentName, '[local]_[path][name]');
  });
});

test('exportOnlyLocals mirrors the isServer flag for CSS modules', (t) => {
  withNodeEnv('development', () => {
    const serverUtils = makeUtils(t);
    const { moduleBranch: serverBranch } = getRules({}, true, serverUtils);
    assert.equal(serverUtils.getStyleLoaders.mock.calls[0].arguments[1].modules.exportOnlyLocals, true);

    const clientUtils = makeUtils(t);
    const { moduleBranch: clientBranch } = getRules({}, false, clientUtils);
    assert.equal(clientUtils.getStyleLoaders.mock.calls[0].arguments[1].modules.exportOnlyLocals, false);

    void serverBranch;
    void clientBranch;
  });
});

test('forwards user-supplied sass options to sass-loader, stripping the reserved "id"', (t) => {
  withNodeEnv('development', () => {
    const utils = makeUtils(t);
    const { moduleBranch, plainBranch } = getRules(
      { id: 'custom-instance', additionalData: '$foo: bar;' },
      false,
      utils
    );

    for (const branch of [moduleBranch, plainBranch]) {
      const sassLoader = branch.use.at(-1);
      assert.equal(sassLoader.options.additionalData, '$foo: bar;');
      assert.equal('id' in sassLoader.options, false);
    }
  });
});

test('a user-supplied sourceMap option overrides the computed default for sass-loader', (t) => {
  withNodeEnv('development', () => {
    const utils = makeUtils(t);
    const { moduleBranch, plainBranch } = getRules({ sourceMap: false }, false, utils);

    assert.equal(moduleBranch.use.at(-1).options.sourceMap, false);
    assert.equal(plainBranch.use.at(-1).options.sourceMap, false);

    // The css-loader chain is unaffected by the sass-loader override.
    const [moduleStyleCall] = utils.getStyleLoaders.mock.calls;
    assert.equal(moduleStyleCall.arguments[1].sourceMap, true);
  });
});
