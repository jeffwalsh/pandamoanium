const path = require('path')
const preprocess = require('svelte-preprocess')
const { ESBuildPlugin } = require('esbuild-loader')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const {
  MiniHtmlWebpackPlugin,
  generateCSSReferences,
  generateJSReferences
} = require('mini-html-webpack-plugin');

const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const WebpackBar = require('webpackbar')
const DotenvPlugin = require('dotenv-webpack')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const CopyWebpackPlugin = require('copy-webpack-plugin')

exports.copyImages = ({ limit } = {}) => ({
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/images', to: "images" },
      ],
    }),
  ]
})

exports.watch = () => ({
  watch: true,
  watchOptions: {
    ignored: '**/node_modules',
    aggregateTimeout: 500,
    poll: 5000,
  },
})


exports.page = () => ({
  plugins: [
    new MiniHtmlWebpackPlugin({
      context: {
        title: 'pandaMOANium',
        jsAttributes: {
          defer: true
        }
      },
      template: ({
        css,
        js,
        publicPath,
        title,
        htmlAttributes,
        cssAttributes,
        jsAttributes
      }) => {
        const cssTags = generateCSSReferences({
          files: css,
          attributes: cssAttributes,
          publicPath
        });

        const jsTags = generateJSReferences({
          files: [js[0]],
          attributes: jsAttributes,
          publicPath
        });

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset='utf-8'>
          <meta name='viewport' content='width=device-width,initial-scale=1'>
        
          <title>${title}</title>
          ${cssTags}
          <link rel='icon' type='image/png' href='/favicon.png'>
          <link rel='stylesheet' href='global.css'>
        
          <script defer src='build/bundle.js'></script>
        </head>
        
        <body>
        ${jsTags}
        </body>
        </html>
        `;
      }
    })
  ]
});

exports.generateSourceMaps = ({ type }) => ({ devtool: type })

exports.loadImages = ({ limit } = {}) => ({
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|webp)$/,
        type: 'asset/resource',
        parser: { dataUrlCondition: { maxSize: limit } }
      }
    ]
  }
})

exports.optimize = () => ({
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: 'all'
    },
    runtimeChunk: { name: 'runtime' },
    minimizer: [`...`, new CssMinimizerPlugin()]
  }
})

exports.analyze = () => ({
  plugins: [
    new BundleAnalyzerPlugin({
      generateStatsFile: true
    })
  ]
})

exports.typescript = () => ({
  module: { rules: [{ test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ }] }
})

exports.loadSvg = () => ({
  module: { rules: [{ test: /\.svg$/, type: 'asset/resource' }] }
})

exports.postcss = () => ({
  loader: 'postcss-loader'
})

exports.extractCSS = ({ options = {}, loaders = [] } = {}) => {
  return {
    module: {
      rules: [
        {
          test: /\.(p?css)$/,
          use: [{
            loader: MiniCssExtractPlugin.loader, options
          }, 'css-loader'].concat(loaders),
          sideEffects: true
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css'
      })
    ]
  }
}

exports.svelte = mode => {
  const prod = mode === 'production'
  return {
    resolve: {
      alias: {
        svelte: path.dirname(require.resolve('svelte/package.json'))
      },
      extensions: ['.mjs', '.js', '.svelte', '.d.ts', '.ts'],
      mainFields: ['svelte', 'browser', 'module', 'main'],
      fallback: {
        "fs": false
      }
    },
    module: {
      rules: [
        {
          test: /\.svelte$/,
          use: {
            loader: 'svelte-loader',
            options: {
              compilerOptions: {
                dev: !prod
              },
              emitCss: prod,
              hotReload: !prod,
              preprocess: preprocess({
                postcss: true,
                typescript: true
              })
            }
          }
        },
        {
          test: /node_modules\/svelte\/.*\.mjs$/,
          resolve: {
            fullySpecified: false
          }
        }
      ]
    }
  }
}

exports.esbuild = () => {
  return {
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'esbuild-loader',
          options: {
            target: 'esnext'
          }
        },
        {
          test: /\.ts$/,
          loader: 'esbuild-loader',
          options: {
            loader: 'ts',
            target: 'esnext'
          }
        }
      ]
    },
    plugins: [new ESBuildPlugin()]
  }
}

exports.cleanDist = () => ({
  plugins: [new CleanWebpackPlugin()]
})

exports.useWebpackBar = () => ({
  plugins: [new WebpackBar()]
})

exports.useDotenv = () => ({
  plugins: [new DotenvPlugin()]
})

exports.useNodePolyfill = () => ({
    plugins: [new NodePolyfillPlugin()]
})
