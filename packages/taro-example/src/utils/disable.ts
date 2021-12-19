import { getCurrentPages, PageInstance } from '@tarojs/taro';

type IPage = PageInstance & { setData: (data: Record<string, any>) => void };

class Disable {
  private static instance: Disable;
  private constructor() {}

  public static getInstance(): Disable {
    if (!this.instance) {
      this.instance = new Disable();
    }

    return this.instance;
  }

  private getCurrentPage = () => {
    const pages = getCurrentPages();
    const curPage = pages[pages.length - 1] || {};
    return (curPage as any) as IPage;
  };

  public show() {
    const currentPage = this.getCurrentPage();

    if (!currentPage) {
      return;
    }
    currentPage.setData({ __disable__: { visible: true } });
  }

  public hide() {
    const currentPage = this.getCurrentPage();

    if (!currentPage) {
      return;
    }

    currentPage.setData({ __disable__: { visible: false } });
  }
}

export default Disable.getInstance();
