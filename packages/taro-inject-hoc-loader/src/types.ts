export interface LoaderOptions {
  hoc: Hoc[];
}

export interface HocBase {
  /** Hoc唯一标识符 */
  name: string;
  /** 路径 */
  path: string;
}

export interface Hoc extends HocBase {
  /** 是否注入 */
  isInject: (filePath: string) => boolean;
}
