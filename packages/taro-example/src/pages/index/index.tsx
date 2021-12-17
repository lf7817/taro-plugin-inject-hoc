import { Component } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { navigateTo } from '@tarojs/taro';
import './index.css';

export default class Index extends Component {
  componentWillMount() {}

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return (
      <View className="index">
        <View style={{ textAlign: 'center', fontWeight: 'bold', margin: '40rpx 0' }}>支持情况</View>
        <Button onClick={() => navigateTo({ url: '/pages/demo/index' })}>
          默认导出唯一标识符情况
        </Button>
        <Button onClick={() => navigateTo({ url: '/pages/demo1/index' })}>
          默认导出箭头函数情况
        </Button>
        <Button onClick={() => navigateTo({ url: '/pages/demo2/index' })}>
          默认导出类声明情况
        </Button>
        <Button onClick={() => navigateTo({ url: '/pages/demo3/index' })}>
          默认导出函数声明情况
        </Button>
        <Button onClick={() => navigateTo({ url: '/pages/demo4/index' })}>
          默认导出调用表达式情况
        </Button>
        <View style={{ textAlign: 'center', fontWeight: 'bold', margin: '40rpx 0' }}>已知问题</View>
        <Button onClick={() => navigateTo({ url: '/pages/demo5/index' })}>顺序错乱情况</Button>
        <Button onClick={() => navigateTo({ url: '/pages/demo6/index' })}>
          useDidShow不触发情况
        </Button>
      </View>
    );
  }
}
