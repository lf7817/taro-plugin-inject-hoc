import { View } from '@tarojs/components';
import { FC } from 'react';

const Demo: FC<{}> = () => {
  return <View>1</View>;
};

// export default Demo;

function inject(...args: any[]) {
  return function(a: any) {
    return a;
  };
}

function observer(a: any) {}

export default inject('CartStore', 'HomeStore')(observer(Demo));
