import { FC } from 'react';
import { View } from '@tarojs/components';
// 引入不用
import hocB from '@/hoc/hocB';

const Demo: FC<{}> = () => (
  <View>
    <View>顺序错乱情况</View>
    <View>
      尽量不在页面里手动引用需要注入高阶组件，虽然不会重复注入，但是会造成注入顺序错乱的问题（引入了不使用也会导致）
    </View>
  </View>
);

export default Demo;
