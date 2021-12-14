import { traverse } from '@babel/core';
import { parse } from '@babel/parser';
import types, { CallExpression } from '@babel/types';
import { HocBase, LoaderOptions } from './types';

/**
 * 根据loader options筛选出需要注入的高阶组件
 * @param loaderOptions
 * @param filePath
 */
export function getNeedInjectHocByOptions(
  loaderOptions: LoaderOptions,
  filePath: string
) {
  return loaderOptions.hoc.reduce((arr, options) => {
    if (options.isInject(filePath)) {
      arr.push({ name: options.name, path: options.path });
    }
    return arr;
  }, [] as HocBase[]);
}

/**
 * 生成语法树
 */
export function parseAstTree(source: string) {
  return parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties'],
  });
}

/**
 * 根据AST语法树分析出实际需要注入的hoc
 */
export function getNeedInjectHocByAst(ast: any, hocList: HocBase[]) {
  const needInjectHocList = [...hocList];

  traverse(ast, {
    // 查找是否有导入
    ImportDeclaration(path) {
      const index = needInjectHocList.findIndex(
        item => item.path === path.node.source.value
      );

      if (index >= 0) {
        needInjectHocList.splice(index, 1);
      }
    },
  });

  return needInjectHocList;
}

export function generateCallExpression(
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
