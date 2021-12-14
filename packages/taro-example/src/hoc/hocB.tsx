import { View } from '@tarojs/components';
import { ComponentType } from 'react';

export default function isLogin<T extends Record<string, any>>(
  Comp: ComponentType<T>
) {
  return function(props) {
    return (
      <>
        <Comp {...props} />
        <View
          style={{
            background: 'yellow',
            color: '#000',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          HocB
        </View>
      </>
    );
  };
}
