# taro-inject-hoc-loader

本loder主要是为了给小程序（taro）页面注入高阶组件所写的，众所周知小程序没有公共入口定义全局组件，所以想通过注入高阶组件的形式给页面注入公共代码。（纯react项目应该也能用）

## 安装

```bash
npm install --save-dev taro-inject-hoc-loader
```

## 使用

添加 loader

```js
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
                  name: 'isDisabledHoc',
                  path: '@/components/hoc/isDisabled',
                  isInject: (filePath) =>
                    /(packages\/[0-9A-Za-z_-]+\/)?pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
                },
                {
                  name: 'isInitializedHoc',
                  path: '@/components/hoc/isInitialized',
                  isInject: (filePath) =>
                    /(packages\/[0-9A-Za-z_-]+\/)?pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
                },
              ],
            },
          },
        ],
      },
    },
  },
});
```

## 参数

loader 可以接受如下参数： 
| 参数项 | 类型 | 用途 | 
| :-----| :---- | :---- | 
| hoc | array | hoc 配置 |

hoc 字段如下： 

| 参数项 | 类型 | 用途 | 
| :-----| :---- | :---- | 
| name | string | 高阶组件唯一标识符 | 
| path | string | 高阶组件相对路径，支持 alias | 
| isInject | function(filePath: string): boolean | 判断是否注入 hoc，接受当前文件路径，输出 boolean, true-插入，false-不插入 |

## 什么情况下会注入

> 目前只想到五种情况需要注入，后续想到再加吧

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

## 注入后的页面长什么样子

以上面 demo 为例, 注入两个高阶组件

```js
{
  hoc: [
    {
      name: 'isDisabledHoc',
      path: '@/components/hoc/isDisabled',
      isInject: (filePath) =>
        /(packages\/[0-9A-Za-z_-]+\/)?pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
    },
    {
      name: 'isInitializedHoc',
      path: '@/components/hoc/isInitialized',
      isInject: (filePath) =>
        /(packages\/[0-9A-Za-z_-]+\/)?pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
    },
  ],
}
```

Demo组件

```tsx
// 这里以默认导出唯一标识符为例，其他情况一样
const Demo: FC<{}> = () => {
  return <View>demo</View>;
}

export default Demo
```

注入后

```tsx
import isDisabledHoc from "@/components/hoc/isDisabled";
import isInitializedHoc from "@/components/hoc/isInitialized";

const Demo: FC<{}> = () => {
  return <View>demo</View>;
}
// 注意插入顺序
export default isInitializedHoc(isDisabledHoc(Demo))
```

## 注入多个高阶组件时，插入顺序是怎样的

正常情况下插入顺序如上面示例一样，以类似队列的形式插入，先入先出，但是某些情况下顺序可能会乱掉

例如下面情况，配置如下
```js
{
  hoc: [
    {
      name: 'isDisabledHoc',
      path: '@/components/hoc/isDisabled',
      isInject: (filePath) =>
        /(packages\/[0-9A-Za-z_-]+\/)?pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
    },
    {
      name: 'isInitializedHoc',
      path: '@/components/hoc/isInitialized',
      isInject: (filePath) =>
        /(packages\/[0-9A-Za-z_-]+\/)?pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
    },
    {
      name: 'isDemo',
      path: '@/components/hoc/isDemo',
      isInject: (filePath) =>
        /(packages\/[0-9A-Za-z_-]+\/)?pages\/[0-9A-Za-z_-]+\/index\.tsx$/.test(filePath),
    },
  ],
}
```

Demo组件

```tsx
// 注意这里引入了，但是没调用
import isInitializedHoc from '@/components/hoc/isInitialized'

const Demo: FC<{}> = () => {
  return <View>demo</View>;
}

export default Demo
```
我们想实现的效果如下

```tsx
export default isDemo(isInitializedHoc(isDisabledHoc(Demo)))
```

先说下hoc插入机制，插入前先分析下依赖，如果高阶组件没有引入就会插入，否则不会插入，即使引入了没有用也不会插入，另外loader会匹配一个文件多次（至于为啥我也不知道，不太熟悉loader机制，有空研究下），这里匹配了3次。

前两次结果如下：

```tsx
import isDisabledHoc from "@/components/hoc/isDisabled";
import isDemo from "@/components/hoc/isDemo";
import { View } from '@tarojs/components';
import isInitialized from '@/components/hoc/isInitialized';

const Demo = () => {
  return <View>demo</View>;
};

export default isDemo(isDisabledHoc(Demo));
```
检测到``isInitialized``被引入了，所以没插入

第三次：
```tsx
import isInitializedHoc from "@/components/hoc/isInitialized";
import isDisabledHoc from "@/components/hoc/isDisabled";
import isDemo from "@/components/hoc/isDemo";
import { View } from '@tarojs/components';
import { jsx as _jsx } from "react/jsx-runtime";

var Demo = function Demo() {
  return /*#__PURE__*/_jsx(View, {
    children: "demo"
  });
};

export default isInitializedHoc(isDemo(isDisabledHoc(Demo)));
```
显然第三次jsx被转成了js，同时没有使用的依赖被删了，所以当loader匹配到该source时检测到``isInitializedHoc``还没引入就插入了。。。

所以，尽量避免这种情况

## 副作用

假使我们要给页面注入下面高阶组件

```tsx
export function isInitialized<T extends Record<string, any>>(
  Comp: ComponentType<T>,
  Loading?: ReactNode,
) {
  return function (props) {
    const [isInit] = useGlobalState('isInitialized');

    if (isInit) {
      return <Comp {...props} />;
    }

    if (Loading) {
      return Loading;
    }

    return <View className={styles.wrapper}>loading</View>;
  };
}
```
Demo页面

```tsx
const Demo: FC<{}> = () => {
  useDidShow(() => {
    console.log('show')
  })

  return <View>FunctionDeclaration</View>;
}

export default
```
可以看到在未初始化完成的情况下，页面组件没有被加载，所以useDidShow不会触发。后续初始化完成后第二次触发didShow
不受影响。
