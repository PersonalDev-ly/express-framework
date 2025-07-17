/**
 * 允许匿名访问装饰器，用于标记无需登录校验的方法
 * 用法：@AllowAnonymous()
 */
export function AllowAnonymous(): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(
      'allow_anonymous',
      true,
      target.constructor,
      propertyKey!,
    );
    return descriptor;
  };
}
