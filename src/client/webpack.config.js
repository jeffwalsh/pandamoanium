const path = require("path");
const { merge } = require("webpack-merge");
const parts = require("./webpack.parts");
const { mode } = require("webpack-nano/argv");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
var dotenv = require("dotenv").config({ path: __dirname + "/.env" });

const PACKAGE = require("./package.json");

const TARGET_PATH = mode == "production" ? "build/production" : "build/dev";
const common = merge([
    {
        entry: {
            main: ["./src/main.ts"]
        },
    },
    {
        plugins: [
            new webpack.DefinePlugin({
                "process.env": JSON.stringify(dotenv.parsed),
            })
        ],
    },
    {
        resolve: {
            fallback: {
                buffer: require.resolve('buffer/')
            }
        }
    },
    {
        output: {
            publicPath: "",
            path: path.resolve(process.cwd(), TARGET_PATH),
            filename: "[name]/index.js",
        },
    },
    
    parts.page(),
    parts.loadSvg(),
    parts.loadImages(),
    parts.copyImages(),
    parts.svelte(mode),
    parts.extractCSS({ loaders: [parts.postcss()] }),
    parts.cleanDist(),
    parts.useWebpackBar(),
    parts.useNodePolyfill()
]);

const development = merge([
    { target: "web" },
    {
        optimization: {
            minimize: false,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        ecma: undefined,
                    },
                }),
            ],
        },
    },
    parts.generateSourceMaps({ type: "cheap-module-source-map" }),
    parts.esbuild(),
    parts.watch(),
]);

const production = merge([
    {
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        ecma: undefined,
                    },
                }),
            ],
        }
    },
    
    parts.generateSourceMaps({ type: "hidden-source-map" }),
    parts.esbuild(),
]);

const getConfig = (mode) => {
    switch (mode) {
        case "production":
            return merge(common, production, { mode });
        case "development":
            return merge(common, development, { mode });
        default:
            throw new Error(`Unknown mode, ${mode}`);
    }
};

module.exports = getConfig(mode);
