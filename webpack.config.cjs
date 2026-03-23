/**
 * Author: @devinjeon (Hyojun Jeon)
 * Copyright (c) 2025 devinjeon (Hyojun Jeon)
 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    const publicPath = isProduction ? '/gogoduck/' : '/';

    return {
    entry: './src/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath,
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|ico|m4a)$/i,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
            filename: 'index.html',
            templateParameters: {
                basePath: publicPath,
                lang: 'ko',
                seo: {
                    title: '오리 경주 추첨 게임 - 달려라! 오리 레이스 뽑기 | Go-Go! Duck Roulette',
                    description: '오리 경주 추첨 게임! 오리들이 달리기 레이스를 펼치는 랜덤 뽑기 룰렛입니다. 커피 내기, 이벤트 당첨자 선정, 발표 순서 정하기 등에 활용해 보세요!',
                    keywords: '오리 경주, 오리 레이스, 오리 달리기, 오리 룰렛, 오리 경주 추첨 게임, 오리 레이스 뽑기, 오리 달리기 뽑기, 오리 경주 게임, 오리 레이스 게임, 오리 달리기 게임, duck roulette, 랜덤 추첨, 순위 추첨, 뽑기, 커피 내기, 발표 순서, 제비뽑기, 이벤트 당첨자',
                    appName: '오리 경주 추첨 게임 - Go-Go! Duck Roulette',
                    url: 'https://hyojun.me/gogoduck',
                },
            },
        }),
        new HtmlWebpackPlugin({
            template: './index.html',
            filename: 'en/index.html',
            templateParameters: {
                basePath: publicPath,
                lang: 'en',
                seo: {
                    title: 'Go-Go! Duck Roulette - Random Duck Race Lottery Game',
                    description: 'A random lottery game powered by duck races! Watch unpredictable ducks race and pick winners. Great for coffee bets, event draws, presentation order, and more!',
                    keywords: 'duck race, duck roulette, random lottery, duck racing game, random picker, random draw, team picker, coffee bet, event winner, presentation order',
                    appName: 'Go-Go! Duck Roulette',
                    url: 'https://hyojun.me/gogoduck/en/',
                },
            },
        }),
        new HtmlWebpackPlugin({
            template: './index.html',
            filename: 'ko/index.html',
            templateParameters: {
                basePath: publicPath,
                lang: 'ko',
                seo: {
                    title: '오리 경주 추첨 게임 - 달려라! 오리 레이스 뽑기 | Go-Go! Duck Roulette',
                    description: '오리 경주 추첨 게임! 오리들이 달리기 레이스를 펼치는 랜덤 뽑기 룰렛입니다. 커피 내기, 이벤트 당첨자 선정, 발표 순서 정하기 등에 활용해 보세요!',
                    keywords: '오리 경주, 오리 레이스, 오리 달리기, 오리 룰렛, 오리 경주 추첨 게임, 오리 레이스 뽑기, 오리 달리기 뽑기, 오리 경주 게임, 오리 레이스 게임, 오리 달리기 게임, duck roulette, 랜덤 추첨, 순위 추첨, 뽑기, 커피 내기, 발표 순서, 제비뽑기, 이벤트 당첨자',
                    appName: '오리 경주 추첨 게임 - Go-Go! Duck Roulette',
                    url: 'https://hyojun.me/gogoduck/ko/',
                },
            },
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'assets', to: 'assets' },
                { from: 'favicon.ico', to: 'favicon.ico' },
                { from: 'qr-code.png', to: 'qr-code.png' },
                { from: 'thumb.png', to: 'thumb.png' },
            ],
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
    ],
    optimization: {
        minimizer: [
            // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
            `...`,
            new CssMinimizerPlugin(),
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
        hot: true,
        historyApiFallback: {
            rewrites: [
                { from: /^\/en\/?$/, to: '/en/index.html' },
                { from: /^\/ko\/?$/, to: '/ko/index.html' },
            ],
        },
    },
    performance: {
        maxAssetSize: 2000000, // 2MB
        maxEntrypointSize: 2000000, // 2MB
    },
    };
};
