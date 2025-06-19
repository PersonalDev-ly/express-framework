import "reflect-metadata";
import { Middleware, ROUTE_METADATA, RouteDefinition } from "../types";

/**
 * 中间件装饰器，用于为路由方法添加中间件
 * @param middleware 要应用的中间件函数或函数数组
 */
export function Use(...middleware: Middleware[]): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    // 获取已存在的路由定义
    const routes: RouteDefinition[] =
      Reflect.getMetadata(ROUTE_METADATA, target.constructor) || [];

    // 查找当前方法的路由定义
    const routeIndex = routes.findIndex(
      (route) => route.methodName === propertyKey
    );

    if (routeIndex !== -1) {
      // 将中间件添加到路由定义中
      routes[routeIndex].middleware = [
        ...routes[routeIndex].middleware,
        ...middleware,
      ];

      // 更新元数据
      Reflect.defineMetadata(ROUTE_METADATA, routes, target.constructor);
    }

    return descriptor;
  };
}
