var _ = require('lodash');
var webpack = require('webpack');
var argv = require('minimist')(process.argv.slice(2));
var path = require('path');

var DEBUG = !argv.release;

var AUTOPREFIXER_LOADER = 'autoprefixer-loader?{browsers:' + JSON.stringify([
    'Android 2.3',
    'Android >= 4',
    'Chrome >= 20',
    'Firefox >= 24',
    'Explorer >= 8',
    'iOS >= 6',
    'Opera >= 12',
    'Safari >= 6']) + '}';

var GLOBALS = {
  'process.env.NODE_ENV': DEBUG ? '"development"' : '"production"',
  '__DEV__': DEBUG
};

//
// Common configuration chunk to be used for both
// client-side (app.js) and server-side (server.js) bundles
// -----------------------------------------------------------------------------

var config = {
  output: {
    path: './build/',
    publicPath: './',
    sourcePrefix: '  '
  },

  cache: DEBUG,
  debug: DEBUG,
  devtool: DEBUG ? '#inline-source-map' : false,

  stats: {
    colors: true,
    reasons: DEBUG
  },

  plugins: [
    new webpack.optimize.OccurenceOrderPlugin()
  ],

  resolve: {
    alias: {__SRC__: path.resolve(__dirname, 'src') + '/'},
    extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
  },

  module: {
    preLoaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint'
      }
    ],

    //TODO add stylus sourcemaps, csslint-loader, and an image optimization loader
    loaders: [
      {
        test: /\.json/,
        loader: 'json'
      },
      {
        test: /\.css$/,
        loader: 'style!css!' + AUTOPREFIXER_LOADER + '!csscomb'
      },
      {
        test: /\.styl$/,
        loader: 'style!css!stylus'
      },
      {
        test: /\.gif/,
        loader: 'url?limit=10000&mimetype=image/gif'
      },
      {
        test: /\.jpg/,
        loader: 'url?limit=10000&mimetype=image/jpg'
      },
      {
        test: /\.png/,
        loader: 'url?limit=10000&mimetype=image/png'
      },
      {
        test: /\.svg/,
        loader: 'url?limit=10000&mimetype=image/svg+xml'
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel'
      }
    ]
  },
  stylus: {use: [(require('nib'))(), (require('rupture'))(), (require('jeet'))(), (require('autoprefixer-stylus'))()]}
};

//
// Configuration for the client-side bundle (app.js)
// -----------------------------------------------------------------------------

var appConfig = _.merge({}, config, {
  entry: './src/app.js',
  output: {
    filename: 'app.js'
  },
  plugins: config.plugins.concat([
      new webpack.DefinePlugin(_.merge(GLOBALS, {'__SERVER__': false}))
    ].concat(DEBUG ? [] : [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin(), // NOTE: this will also minify CSS
        new webpack.optimize.AggressiveMergingPlugin()
      ])
  )
});

//
// Configuration for the server-side bundle (server.js)
// -----------------------------------------------------------------------------

var serverConfig = _.merge({}, config, {
  entry: './src/server.js',
  output: {
    filename: 'server.js',
    libraryTarget: 'commonjs2'
  },
  target: 'node',
  externals: /^[a-z][a-z\.\-0-9]*$/,
  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __filename: false,
    __dirname: false
  },
  plugins: config.plugins.concat(
    new webpack.DefinePlugin(_.merge(GLOBALS, {'__SERVER__': true}))
  ),
  module: {
    loaders: config.module.loaders.map(function (loader) {
      // Remove style-loader
      return _.merge(loader, {
        loader: loader.loader = loader.loader.replace('style!', '')
      });
    })
  }
});

module.exports = [appConfig, serverConfig];
