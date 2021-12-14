import { FC } from 'react';
import { View } from '@tarojs/components';
import hocD from '@/hoc/hocD';

const Demo: FC<{}> = () => <View>CallExpression</View>;

export default hocD(Demo);
