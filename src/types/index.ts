import { NextFunction, Request, Response } from "express";

export type Constructor<T = any> = new (...args: any[]) => T;

export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export type RouteDefinition = {
  path: string;
  method: string;
  methodName: string | symbol;
  middleware: Middleware[];
};

export type ControllerDefinition = {
  basePath: string;
  routes: RouteDefinition[];
};

export interface ParamMetadata {
  index: number;
  type: "body" | "query" | "param" | "headers" | "cookies";
  name?: string;
}

export const CONTROLLER_METADATA = "controller:metadata";
export const ROUTE_METADATA = "route:metadata";
export const PARAM_METADATA = "param:metadata";
