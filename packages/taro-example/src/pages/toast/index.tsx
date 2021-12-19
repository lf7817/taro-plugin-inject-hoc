import toast from '@/utils/toast';
import { View, Button } from '@tarojs/components';
import { FC } from 'react';

const Demo: FC<{}> = () => (
  <View>
    <Button onClick={() => toast.show({ title: 'Hello' })}>toast</Button>
  </View>
);

export default Demo;
