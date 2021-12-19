import { useGlobalState } from '@/store';
import disable from '@/utils/disable';
import toast from '@/utils/toast';
import { View, Button } from '@tarojs/components';
import { FC } from 'react';

const Demo: FC<{}> = () => {
  const [isDisabled, setDisableState] = useGlobalState('isDisabled');
  return (
    <View>
      <Button
        onClick={() => {
          setDisableState(true);
          disable.show();
        }}
      >
        {isDisabled ? '解禁' : '禁用'}
      </Button>
    </View>
  );
};

export default Demo;
