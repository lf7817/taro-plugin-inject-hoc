import { IPluginContext } from '@tarojs/service';
import { Subpackage, TaroPluginInjectTemplateOptions } from './types';

export default function taroPluginInjectTemplate(
  ctx: IPluginContext,
  options: TaroPluginInjectTemplateOptions
) {
  const { platform } = ctx.runOpts.options;
  const { outputPath } = ctx.paths;
  const { exclude = [], path } = options;
  const { printLog, processTypeEnum, fs } = ctx.helper;

  /**
   * 校验options
   */
  ctx.addPluginOptsSchema(joi =>
    joi
      .object()
      .keys({
        path: joi
          .array()
          .items(joi.string())
          .required(),
        exclude: joi.array().items(joi.string()),
      })
      .required()
  );

  /**
   * 校验平台，暂时只支持微信小程序
   */
  if (platform !== 'weapp') {
    printLog(
      processTypeEnum.WARNING,
      `"taro-plugin-inject-template" 插件暂时不支持 "${platform}" 平台`
    );
    return;
  }

  ctx.onBuildFinish(async () => {
    // 获取需要注入的页面
    const pages = getNeedInjectPages();
    // 注入template到base.wxml
    injectToBase();
    // 页面引用
    await injectToPages(pages);
  });

  /**
   * 获取需要注入的页面
   */
  function getNeedInjectPages() {
    const appJson = JSON.parse(
      fs.readFileSync(`${outputPath}/app.json`, 'utf-8')
    );
    const subpackages: Subpackage[] = appJson?.subpackages || [];

    return subpackages
      .reduce((arr, p) => {
        p.pages.forEach(item => {
          arr.push(p.root + '/' + item);
        });

        return arr;
      }, appJson.pages as string[])
      .filter(item => exclude.indexOf(item) === -1);
  }

  /**
   * 注入template到base.wxml
   */
  function injectToBase() {
    let wxml = '';
    let wxss = '';

    path.forEach(p => {
      if (fs.existsSync(`${p}/index.wxml`)) {
        // 追加到base.wxml
        wxml += fs.readFileSync(`${p}/index.wxml`, 'utf-8') + '\n';
      }

      if (fs.existsSync(`${p}/index.wxss`)) {
        // 追加到common.wxss
        wxss += fs.readFileSync(`${p}/index.wxss`, 'utf-8') + '\n';
      }
    });

    fs.appendFileSync(`${outputPath}/base.wxml`, wxml, 'utf-8');
    fs.appendFileSync(`${outputPath}/app.wxss`, wxss, 'utf-8');
  }

  async function injectToPages(pages: string[]) {
    const injectPromises = pages.map(p => {
      return new Promise(resolve => {
        fs.appendFileSync(
          outputPath + '/' + p + '.wxml',
          getInjectStr(path.map(item => item.split('/').pop() as string)),
          'utf8'
        );
        resolve(true);
      });
    });

    try {
      await Promise.all(injectPromises);
    } catch (err) {
      console.log(err);
      printLog(
        processTypeEnum.WARNING,
        `"taro-plugin-inject-template" 模版注入失败`
      );
    }
  }

  /**
   * 生成注入内容
   * @param {string[]} templateName 模版名数组
   * @desc
   */
  function getInjectStr(templateName: string[]) {
    return templateName.reduce((str, item) => {
      str += `<template is="${item}" data="{{__${item}__}}" />`;
      return str;
    }, '');
  }
}
