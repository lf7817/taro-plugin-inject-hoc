# 小程序全局公共组件注入

## 背景

众所周知，小程序中不能定义全局组件，只能在每个页面手动引入，随着项目越来越大，这种方式无疑是繁琐和低效的，还有可能会忘记，所以今天我们来研究下通过工程化的方式自动注入。



## 方式一：混合开发方式

> [参考文档](https://github.com/lawler61/blog/blob/master/js/taro-mini/index.md)

本次内容准备了两个demo

- 实现自定义的toast（采用api的方式调用）
- 实现全局的、有状态的遮罩

![iShot2021-12-20 17.00.50](https://fan-1257622445.cos.ap-nanjing.myqcloud.com/2021/12/20/ishot20211220-170050.gif)


### 编译后的页面

开始前我们现看下taro将页面编译成了什么样子
源文件

![](https://fan-1257622445.cos.ap-nanjing.myqcloud.com/2021/12/20/16399253264332.jpg)
编译后
![](https://fan-1257622445.cos.ap-nanjing.myqcloud.com/2021/12/20/16399253517995.jpg)
base.wxml
![](https://fan-1257622445.cos.ap-nanjing.myqcloud.com/2021/12/20/16399258846517.jpg)


可以发现，编译完后的wxml全部长得一样，taro会根据data决定渲染模版

### 采用原生的方式实现

如下图所示，我们先采用[原生](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html)的方式实现，如下图


![](https://fan-1257622445.cos.ap-nanjing.myqcloud.com/2021/12/20/16399270306303.jpg)
可以看到效果实现了，接下来想办法实现自动注入

### 自动注入

#### 步骤：
- `template`模版注入到`base.wxml`（减少页面大小）
- 每个页面中引入下`<template is="toast" data="{{__toast__}}" />`
- 样式文件注入到`app.css`中
- 封装Toast类（采用`getCurrentPages`获取当前页面实例，调用setData）

#### 编写 toast wxml

```xml
<template name="toast">
  <view class="my-toast {{__toast__.visible ? '' : 'my-toast__hidden'}}">
    <image class="my-toast__icon {{__toast__.icon !== 'none' ? '' : 'my-toast__hidden'}}" src="{{__toast__.icon}}"></image>
    <view class="my-toast__text">{{__toast__.title}}</view>
  </view>
</template>
```

#### 注入template逻辑

这里我们采用自定义[Taro插件](https://taro-docs.jd.com/taro/docs/plugin)的形式实现注入。每次改动Taro都会重新编译所有页面，所以我们需要在每次编译完成后注入。

```ts
export default (ctx) => {
  ctx.onBuildFinish(() => {
    // 获取需要注入的页面
    const pages = getNeedInjectPages();
    // 注入template到base.wxml, wxss到app.css
    injectToBase();
    // 在需要注入的页面中引入
    injectToPages(pages);
  })
}
```
完整代码请参考[这里](https://github.com/lf7817/taro-plugin-inject-hoc/blob/main/packages/taro-plugin-inject-template/src/index.ts)

#### 引入插件

打开`config/index.js`,引入

```ts
const config = {
    ...,
    plugins: [
        [
          path.resolve(__dirname, './taro-plugin-inject-template'),
          {
            path: [
              path.resolve(__dirname, '../', 'src/components/toast'),
            ],
          },
        ],
      ],
    ...,
}
```

### 封装Toast类

```ts
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
```

这样就可以在任意地方调用`toast.show({ ... })`方法了

接着我们照葫芦画瓢实现第二个demo
![iShot2021-12-20 09.51.06](https://fan-1257622445.cos.ap-nanjing.myqcloud.com/2021/12/20/ishot20211220-095106.gif)
我们想要实现的效果是，当小程序被禁用了所有页面都应改弹出遮罩禁止用户操作，但是从上图可以看到页面切换时遮罩就消失了，显然不是我们想要的效果。

为了解决这个问题我们可以监听路由变化，然后重新打开遮罩，但是翻遍微信开发文档也没有找到相关接口，最后在[微信开发社区](https://developers.weixin.qq.com/community/develop/doc/00006a3e9d0940015dc7e54cf5ec00)找到了相关api

```ts
wx.onAppRoute(() => {
  const isDisabled = getGlobalState('isDisabled');

  if (isDisabled) {
    disable.show();
  } else {
    disable.hide();
  }
});
```


### 缺点

- 不能做复杂的交互，比如点击事件；
- 要考虑兼容问题，h5、其他小程序平台；


## 方式二：采用loader注入

> [完整代码](https://github.com/lf7817/taro-plugin-inject-hoc/blob/main/packages/taro-inject-hoc-loader/src/index.ts)

### 效果

hoc
```tsx
import { View } from '@tarojs/components';
import { ComponentType } from 'react';

export default function hocD<T extends Record<string, any>>(
  Comp: ComponentType<T>
) {
  return function(props) {
    return (
      <>
        <Comp {...props} />
        <View
          style={{
            background: 'black',
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          HocD
        </View>
      </>
    );
  };
}
```

Demo页面
```tsx
import { View } from '@tarojs/components';
import { FC } from 'react';

const Demo: FC<{}> = () => <View>Identifier</View>;

export default Demo
```
想要实现的效果
```tsx
export default hocD(Demo)
```

### 难点

页面组件及导出方式五花八门：

- 默认导出唯一标识符：Identifier

  ```tsx
  export default Demo;
  ```

- 默认导出函数声明：FunctionDeclaration

  ```tsx
  // 可以是匿名
  export default function Demo() {
    return <View>demo</View>;
  }
  ```

- 默认导出箭头函数：ArrowFunctionExpression

  ```tsx
  export default () => {
    return <View>demo</View>;
  };
  ```

- 默认导出类声明：ClassDeclaration

  ```tsx
  export default class Demo extends Component {
    render() {
      return <View>demo</View>;
    }
  }
  ```

- 默认导出调用表达式：CallExpression

  ```tsx
  export default isLogin(Demo);
  ```

### 分析AST

> [babel开发手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-asts)
> [AST Explorer](https://astexplorer.net/) 可以让你对 AST 节点有一个更好的感性认识。

还是用上边的例子，对应语法树为：

![](https://fan-1257622445.cos.ap-nanjing.myqcloud.com/2021/12/20/16399823931307.jpg)

#### import高阶组件
遍历所有`ImportDeclaration`，分析是否有没有引入过hocD, 如果没有引入就插入一条`ImportDeclaration`语句
![](https://fan-1257622445.cos.ap-nanjing.myqcloud.com/2021/12/20/16399829463815.jpg)

```ts
let hasImport = false;

traverse(ast, {
  // 查找是否有导入
  ImportDeclaration(path) {
    if (path.node.source.value === '@/hoc/hocD') {
      hasImport = true;
    }
  },
});

if (!hasImport) {
  traverse(ast, {
    ImportDeclaration(path) {
      if (!hasImport) {
        path.insertBefore(
          types.importDeclaration(
            [types.importDefaultSpecifier(types.identifier('hocD'))],
            types.stringLiteral('@/hoc/hocD')
          )
        );
        hasImport = true;
      }
    },
  });
}
```

#### 修改导出语句
现在导出类型为`Identifier`
![](https://fan-1257622445.cos.ap-nanjing.myqcloud.com/2021/12/20/16399845166092.jpg)
我们需要修改成`CallExpression`
![](https://fan-1257622445.cos.ap-nanjing.myqcloud.com/2021/12/20/16399848027588.jpg)

```ts
traverse(ast, {
  ExportDefaultDeclaration(path) {
    let callExpression: types.CallExpression;

    if (!isInjected) {
      switch (path.node.declaration.type) {
        case 'Identifier': {
          callExpression = types.callExpression(types.identifier('hocD'), [
            types.identifier(path.node.declaration.name),
          ]);
          break;
        }
      }

      if (callExpression) {
        path.replaceWith(types.exportDefaultDeclaration(callExpression));
        isInjected = true;
      }
    }
  },
});
```

### 编写loader

搞清楚ast语法树后，接下来我们来编写loader，难度升级一下，支持注入多个高阶组件

```ts
export default function injectHocLoader(source: string) {
// @ts-ignore
  const loaderContext = this;
  /** 当前文件路径, 兼容windows */
  const filePath = loaderContext.resourcePath.replace(/\\/g, '/');
  /** 获取loader options */
  const loaderOptions = (loaderUtils.getOptions(
    loaderContext
  ) as unknown) as LoaderOptions;
  // 校验loader options
  validate(schema as Schema, loaderOptions, { name: PACKAGE_NAME });
  /** 根据loader options筛选出需要注入的高阶组件 */
  const hocList = utils.getNeedInjectHocByOptions(loaderOptions, filePath);
  /** 生成语法树 */
  const ast = utils.parseAstTree(source);
  /** 根据语法树筛选出实际需要注入的hoc */
  const needInjectHocList = utils.getNeedInjectHocByAst(ast, hocList);

  if (
    !needInjectHocList ||
    (needInjectHocList && needInjectHocList.length === 0)
  ) {
    /** 如果没有需要注入的直接return */
    return source;
  }

  /** 是否引入 */
  let isImported = false;
  /** 是否注入 */
  let isInjected = false;

  traverse(ast, {
    ImportDeclaration(path) {
      /** 文件顶部插入声明, 注意这里会被循环调用，所以要判断是否引入过了 */
      if (!isImported) {
        isImported = true;
        path.insertBefore(
          needInjectHocList.map(item =>
            types.importDeclaration(
              [types.importDefaultSpecifier(types.identifier(item.name))],
              types.stringLiteral(item.path)
            )
          )
        );
      }
    },
    ExportDefaultDeclaration(path) {
      let callExpression;

      if (!isInjected) {
        switch (path.node.declaration.type) {
          case 'Identifier': {
            /**
             * 处理export default Demo情况
             */
            callExpression = utils.generateCallExpression(needInjectHocList, [
              types.identifier(path.node.declaration.name),
            ]);
            break;
          }
          case 'CallExpression': {
            /**
             * 处理export default isInit(Demo) 情况
             */
            callExpression = utils.generateCallExpression(needInjectHocList, [
              types.callExpression(
                types.identifier((path.node.declaration.callee as any).name),
                path.node.declaration.arguments
              ),
            ]);
            break;
          }
          case 'FunctionDeclaration': {
            /**
             * 处理export default function(): JSX 情况
             */
            callExpression = utils.generateCallExpression(needInjectHocList, [
              types.functionExpression(
                path.node.declaration.id,
                path.node.declaration.params,
                path.node.declaration.body
              ),
            ]);
            break;
          }
          case 'ClassDeclaration': {
            /**
             * 处理export default class extends Component {} 情况
             */
            callExpression = utils.generateCallExpression(needInjectHocList, [
              types.classExpression(
                path.node.declaration.id,
                path.node.declaration.superClass,
                path.node.declaration.body
              ),
            ]);
            break;
          }
          case 'ArrowFunctionExpression': {
            /**
             * 处理export default () => <View>demo</View> 情况
             */
            callExpression = utils.generateCallExpression(needInjectHocList, [
              types.arrowFunctionExpression(
                path.node.declaration.params,
                path.node.declaration.body
              ),
            ]);
            break;
          }
        }

        if (callExpression) {
          isInjected = true;
          path.replaceWith(types.exportDefaultDeclaration(callExpression));
        } else {
          loaderContext.emitWarning(
            `[inject-hoc-loader]: ${filePath} 注入失败, 类型${path.node.declaration.type}`
          );
        }
      }
    },
  });

  return generate(ast).code;
}

function generateCallExpression(
  needInjectHocList: HocBase[] = [],
  params: any[]
): CallExpression {
  if (needInjectHocList.length === 1) {
    return types.callExpression(
      types.identifier(needInjectHocList[0].name),
      params
    );
  }

  return types.callExpression(types.identifier(needInjectHocList.pop()!.name), [
    generateCallExpression(needInjectHocList, params),
  ]);
}
```

### 添加loader

```ts
webpackChain(chain) {
      chain.merge({
        module: {
          rule: {
            injectHocLoader: {
              test: /\.tsx$/,
              use: [
                {
                  loader: 'taro-inject-hoc-loader',
                  options: {
                    hoc: [
                      {
                        name: 'hocA',
                        path: '@/hoc/hocA',
                        isInject: filePath => /pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
                      },
                      {
                        name: 'hocB',
                        path: '@/hoc/hocB',
                        isInject: filePath => /pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
                      },
                      {
                        name: 'hocC',
                        path: '@/hoc/hocC',
                        isInject: filePath => /pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      });
    },
  },
```
注入顺序如下
```tsx
export default hocC(hocB(hocA(Demo)))
```

### 注意

- 尽量不要在高阶组件里拦截页面渲染，会导致某些情况下`useReady`、`useDidShow`之类的`hooks`无法触发情况（纯react项目没有这个问题）