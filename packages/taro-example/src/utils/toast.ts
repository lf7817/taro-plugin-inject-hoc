import { getCurrentPages, PageInstance } from '@tarojs/taro';

interface ToastShowConfig {
  title: string;
  icon?: string;
  duration?: number;
}

type IPage = PageInstance & { setData: (data: Record<string, any>) => void };

class Toast {
  private static instance: Toast;
  private constructor() {}

  public static getInstance(): Toast {
    if (!this.instance) {
      this.instance = new Toast();
    }

    return this.instance;
  }

  private getCurrentPage = () => {
    const pages = getCurrentPages();
    const curPage = pages[pages.length - 1] || {};
    return (curPage as any) as IPage;
  };

  public show(config: ToastShowConfig) {
    const { title, icon = '', duration = 2000 } = config;
    const currentPage = this.getCurrentPage();

    if (!currentPage) {
      return;
    }
    currentPage.setData({ __toast__: { title, visible: true, icon } });
    setTimeout(() => this.hide(), duration);
  }

  public hide() {
    const currentPage = this.getCurrentPage();

    if (!currentPage) {
      return;
    }

    currentPage.setData({ __toast__: { visible: false, title: '', icon: '' } });
  }
}

export default Toast.getInstance();
