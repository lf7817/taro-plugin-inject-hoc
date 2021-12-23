import { View } from '@tarojs/components';
import { ComponentType, useEffect, useState } from 'react';

export default function isLogin<T extends Record<string, any>>(Comp: ComponentType<T>) {
  return function(props) {
    const [isInitiated, setInitiated] = useState(false);
    useEffect(() => {
      setTimeout(() => {
        setInitiated(true);
      }, 100);
    }, []);

    if (!isInitiated) {
      return (
        <View
          style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          加载中
        </View>
      );
    }

    return (
      <>
        <Comp {...props} />
        <View
          style={{
            background: 'blue',
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          HocC
        </View>
      </>
    );
  };
}
