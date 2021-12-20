export default {
  pages: [
    'pages/index/index',
    'pages/demo/index',
    'pages/demo1/index',
    'pages/demo2/index',
    'pages/demo3/index',
    'pages/demo4/index',
    'pages/demo5/index',
    'pages/demo6/index',
    'pages/toast/index',
    'pages/disable/index',
    'pages/test/index',
  ],
  subpackages: [
    {
      root: 'packages/test',
      pages: ['pages/demo/index'],
    },
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black',
  },
};
