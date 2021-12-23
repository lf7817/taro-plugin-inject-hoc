import { traverse } from '@babel/core';
import loaderUtils from 'loader-utils';
import { validate } from 'schema-utils';
import types from '@babel/types';
import { Schema } from 'schema-utils/declarations/ValidationError';
import schema from './schema';
import { LoaderOptions } from './types';
import * as utils from './utils';
import generate from '@babel/generator';

const PACKAGE_NAME = 'taro-inject-hoc-loader';

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
  if (hocList.length === 0) {
    return source;
  }
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
            // TODO 修复某些情况下插入顺序错误的bug
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
                path.node.declaration.body,
                path.node.declaration.decorators
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
