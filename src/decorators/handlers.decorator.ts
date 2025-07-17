import 'reflect-metadata';
import { ROUTE_METADATA, RouteDefinition } from '../types';

/**
 * 创建路由方法装饰器的工厂函数
 * @param method HTTP方法
 * @returns 方法装饰器
 */
function createRouteDecorator(method: string) {
  return (path: string = ''): MethodDecorator => {
    return (
      target: any,
      propertyKey: string | symbol,
      descriptor: PropertyDescriptor,
    ) => {
      // 确保路径以/开头
      if (path && !path.startsWith('/')) {
        path = `/${path}`;
      }

      // 获取已存在的路由定义或创建新的数组
      const routes: RouteDefinition[] =
        Reflect.getMetadata(ROUTE_METADATA, target.constructor) || [];

      // 添加新的路由定义
      routes.push({
        method: method.toUpperCase(),
        path,
        methodName: propertyKey,
        middleware: [],
      });

      // 更新元数据
      Reflect.defineMetadata(ROUTE_METADATA, routes, target.constructor);

      return descriptor;
    };
  };
}

// 导出HTTP方法装饰器
export const Get = createRouteDecorator('get');
export const Post = createRouteDecorator('post');
export const Put = createRouteDecorator('put');
export const Delete = createRouteDecorator('delete');
export const Patch = createRouteDecorator('patch');
export const Options = createRouteDecorator('options');
export const Head = createRouteDecorator('head');
