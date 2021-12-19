import { createGlobalState } from 'react-hooks-global-state';
import disable from './utils/disable';

interface AppState {
  isDisabled: boolean;
}

export const { useGlobalState, setGlobalState, getGlobalState } = createGlobalState<AppState>({
  isDisabled: false,
});

wx.onAppRoute(() => {
  const isDisabled = getGlobalState('isDisabled');

  if (isDisabled) {
    disable.show();
  } else {
    disable.hide();
  }
});
