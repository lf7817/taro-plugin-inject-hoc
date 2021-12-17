export interface TaroPluginInjectTemplateOptions {
  /**
   * template绝对路径
   * @desc 该目录下应包含index.wxml、index.wxss（可选）文件
   */
  path: string[];
  /**
   * 不需要注入的页面
   */
  exclude?: string[];
}

export interface Subpackage {
  root: string;
  pages: string[];
}
