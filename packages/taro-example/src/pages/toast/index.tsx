import Toast from '@/utils/toast';
import { View, Button } from '@tarojs/components';
import { FC } from 'react';

const Demo: FC<{}> = () => (
  <View>
    <Button onClick={() => Toast.show({ title: 'Hello' })}>toast</Button>
  </View>
);

export default Demo;
