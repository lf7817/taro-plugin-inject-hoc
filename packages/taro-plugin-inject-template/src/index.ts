import { IPluginContext } from '@tarojs/service';
import { TaroPluginInjectTemplateOptions } from './types';

export default function taroPluginInjectTemplate(
  ctx: IPluginContext,
  options: TaroPluginInjectTemplateOptions
) {
  // const { printLog, processTypeEnum } = ctx.helper;

  ctx.onBuildComplete(() => {
    // processTypeEnum.MODIFY;
    console.log(
      '================================================================',
      options
    );
  });
}
