import 'reflect-metadata';
import { PARAM_METADATA, ParamMetadata } from '../types';

/**
 * 创建参数装饰器的工厂函数
 * @param type 参数类型
 * @param name 可选的参数名称
 */
function createParamDecorator(type: ParamMetadata['type']) {
  return (name?: string): ParameterDecorator => {
    return (
      target: object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ) => {
      // 确保propertyKey不是undefined
      if (propertyKey === undefined) return;

      const existingParams: ParamMetadata[] =
        Reflect.getMetadata(PARAM_METADATA, target.constructor, propertyKey) ||
        [];

      existingParams.push({
        index: parameterIndex,
        type,
        name,
      });

      Reflect.defineMetadata(
        PARAM_METADATA,
        existingParams,
        target.constructor,
        propertyKey,
      );
    };
  };
}

// 导出参数装饰器
export const Body = createParamDecorator('body');
export const Query = createParamDecorator('query');
export const Param = createParamDecorator('param');
export const Headers = createParamDecorator('headers');
export const Cookies = createParamDecorator('cookies');

/**
 * 从请求中提取参数值
 * @param req Express请求对象
 * @param type 参数类型
 * @param name 参数名称
 */
export function extractParamValue(
  req: any,
  type: ParamMetadata['type'],
  name?: string,
): any {
  switch (type) {
    case 'body':
      return name ? req.body?.[name] : req.body;
    case 'query':
      return name ? req.query?.[name] : req.query;
    case 'param':
      return name ? req.params?.[name] : req.params;
    case 'headers':
      return name ? req.headers?.[name.toLowerCase()] : req.headers;
    case 'cookies':
      return name ? req.cookies?.[name] : req.cookies;
    default:
      return undefined;
  }
}
