/* eslint-disable import/no-commonjs */
const path = require('path');

const config = {
  projectName: 'taro-inject-hoc',
  date: '2021-10-21',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {},
  },
  framework: 'react',
  plugins: [
    [
      'taro-plugin-inject-template',
      {
        path: [
          path.resolve(__dirname, '../', 'src/components/toast'),
          path.resolve(__dirname, '../', 'src/components/disable'),
        ],
      },
    ],
  ],
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      url: {
        enable: true,
        config: {
          limit: 1024, // 设定转换尺寸上限
        },
      },
      cssModules: {
        enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        config: {
          namingPattern: 'module', // 转换模式，取值为 global/module
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
    webpackChain(chain) {
      chain.merge({
        module: {
          rule: {
            injectHocLoader: {
              test: /\.tsx$/,
              use: [
                {
                  loader: 'taro-inject-hoc-loader',
                  options: {
                    hoc: [
                      {
                        name: 'hocA',
                        path: '@/hoc/hocA',
                        isInject: filePath => /pages\/test\/index\.tsx$/.test(filePath),
                      },
                      // {
                      //   name: 'hocB',
                      //   path: '@/hoc/hocB',
                      //   isInject: filePath => /pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
                      // },
                      // {
                      //   name: 'hocC',
                      //   path: '@/hoc/hocC',
                      //   isInject: filePath => /pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
                      // },
                    ],
                  },
                },
              ],
            },
          },
        },
      });
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        config: {
          namingPattern: 'module', // 转换模式，取值为 global/module
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  },
};

module.exports = function(merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'));
  }
  return merge({}, config, require('./prod'));
};
