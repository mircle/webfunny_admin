const path = require("path")
const webpack = require("webpack")
const Merge = require("webpack-merge")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const LodashModuleReplacementPlugin = require("lodash-webpack-plugin")
const CleanPlugin = require("clean-webpack-plugin")
// const autoprefixer = require("autoprefixer")
// const pxtorem = require("postcss-pxtorem")
const baseConfig = require("./webpack.base.js")
const envConfig = require("./src/common/env_config.js")
const ManifestPlugin = require("webpack-manifest-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = env => {
  const curEnv = env || "local"
  const assetsUrl = envConfig.getAssetsUrl(curEnv, "/webfunny/")
  return Merge(baseConfig, {
    entry: {
      app: path.resolve(__dirname, "src/index.js"),
      vendor: [
        "react-redux"
      ]
    },
    output: {
      filename: "[name].[chunkhash:8].js",
      chunkFilename: "[name].[chunkhash:8].chunk.js",
      path: path.resolve(__dirname, "dist/webfunny"),
      publicPath: assetsUrl
    },
    plugins: [
      new LodashModuleReplacementPlugin,
      new CleanPlugin(["dist"]),
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify("production"),
        "BUILD_ENV": JSON.stringify(curEnv)
      }),
      new webpack.optimize.UglifyJsPlugin({
        beautify: false, // 最紧凑的输出
        comments: false,
        compress: {
          warnings: false, // 在UglifyJs删除没有用到的代码时不输出警告
          drop_console: curEnv === "staging" || curEnv === "prod",
          collapse_vars: true, // 内嵌定义了但是只用到一次的变量
          reduce_vars: true, // 提取出出现多次但是没有定义成变量去引用的静态值
        }
      }),
      new ExtractTextPlugin({
        filename: "app.[contenthash:8].css",
        allChunks: true,
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: "common",
        minChunks: function(module) {
          return module.context && module.context.indexOf("node_modules") !== -1 // this assumes your vendor imports exist in the node_modules directory
        }
      }),
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        htmlWebpackPlugin: {
          "files": {
            "css": ["app.css"],
            "js": ["index.js", "common.js"]
          }
        },
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          minifyJS: true
        },
        chunksSortMode: function(chunk1, chunk2) {
          const orders = ["common", "vendor", "debug", "app"]
          const order1 = orders.indexOf(chunk1.names[0])
          const order2 = orders.indexOf(chunk2.names[0])
          if (order1 > order2) {
            return 1
          } else if (order1 < order2) {
            return -1
          }
          return 0
        },
        webfunny: true,
        baiduAs: false
      }),
      new ManifestPlugin({
        publicPath: assetsUrl
      }),
      new webpack.ProvidePlugin({
        $: "jquery"
      }),
      new CopyWebpackPlugin([{
        from: __dirname + "/src/pwa/"
      }])
    ]
  })
}