import "reflect-metadata";
import { CONTROLLER_METADATA } from "../types";

/**
 * 控制器装饰器，用于标记一个类为控制器并指定基础路径
 * @param basePath 控制器的基础路径
 */
export function Controller(basePath: string = ""): ClassDecorator {
  return (target: any) => {
    // 确保路径以/开头
    if (basePath && !basePath.startsWith("/")) {
      basePath = `/${basePath}`;
    }

    Reflect.defineMetadata(CONTROLLER_METADATA, { basePath }, target);

    // 返回类，以便可以继续使用
    return target;
  };
}
