import { showToast, useDidShow } from '@tarojs/taro';
import { FC } from 'react';
import { View } from '@tarojs/components';

const Demo: FC<{}> = () => {
  useDidShow(() => {
    showToast({ title: 'show' });
  });
  return (
    <View>
      <View>useDidShow不触发情况</View>
    </View>
  );
};

export default Demo;
