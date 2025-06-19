import { Request, Response } from "express";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Use,
} from "../decorators";
import { logger } from "../utils/logger";

// 测试中间件
const testMiddleware = (req: Request, res: Response, next: Function) => {
  logger.info("测试中间件被调用");
  next();
};

@Controller("/test")
export class TestController {
  private items: any[] = [];

  @Use(testMiddleware)
  @Get()
  getAllItems(
    @Query("page") page: string = "1",
    @Query("size") size: string = "10"
  ) {
    logger.info(`获取所有项目，页码：${page}，每页数量：${size}`);
    return {
      page: parseInt(page),
      size: parseInt(size),
      data: this.items,
    };
  }

  @Get(":id")
  getItemById(@Param("id") id: string) {
    logger.debug(`获取项目详情，ID：${id}`);
    const item = this.items.find((item) => item.id === parseInt(id));
    if (!item) {
      throw new Error("Item not found");
    }
    return item;
  }

  @Post()
  createItem(@Body() body: any) {
    const newItem = {
      id: this.items.length + 1,
      ...body,
      createdAt: new Date(),
    };
    logger.info(`创建新项目：`, newItem);
    this.items.push(newItem);
    return newItem;
  }

  @Put(":id")
  updateItem(@Param("id") id: string, @Body() body: any) {
    const index = this.items.findIndex((item) => item.id === parseInt(id));
    if (index === -1) {
      throw new Error("Item not found");
    }

    const updatedItem = {
      ...this.items[index],
      ...body,
      updatedAt: new Date(),
    };
    logger.info(`更新项目，ID：${id}`, updatedItem);
    this.items[index] = updatedItem;
    return updatedItem;
  }

  @Delete(":id")
  deleteItem(@Param("id") id: string) {
    const index = this.items.findIndex((item) => item.id === parseInt(id));
    if (index === -1) {
      throw new Error("Item not found");
    }

    logger.warn(`删除项目，ID：${id}`);
    const deletedItem = this.items[index];
    this.items.splice(index, 1);
    return deletedItem;
  }

  // 测试多个装饰器组合使用
  @Use(testMiddleware)
  @Get("complex/:id")
  complexTest(
    @Param("id") id: string,
    @Query("type") type: string,
    @Query("filter") filter?: string
  ) {
    logger.info(`复杂测试，ID：${id}，类型：${type}，过滤器：${filter}`);
    return {
      id,
      type,
      filter,
      timestamp: new Date(),
    };
  }

  // 测试错误处理
  @Get("error")
  testError() {
    logger.debug("测试错误处理");
    throw new Error("这是一个测试错误");
  }
}
