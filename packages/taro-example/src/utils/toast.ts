import { getCurrentInstance, PageInstance } from '@tarojs/taro';

interface ToastShowConfig {
  title: string;
  icon?: string;
  duration?: number;
}

type Page = PageInstance & { setData: (data: Record<string, any>) => void };

class Toast {
  private constructor() {}

  private static getCurrentPage = () => {
    const { page } = getCurrentInstance();
    return page as Page;
  };

  public static show(config: ToastShowConfig) {
    const { title, icon = '', duration = 2000 } = config;
    const currentPage = this.getCurrentPage();

    if (!currentPage) {
      return;
    }
    currentPage.setData({ __toast__: { title, visible: true, icon } });
    setTimeout(() => this.hide(), duration);
  }

  public static hide() {
    const currentPage = this.getCurrentPage();

    if (!currentPage) {
      return;
    }

    currentPage.setData({ __toast__: { visible: false, title: '', icon: '' } });
  }
}

export default Toast;
