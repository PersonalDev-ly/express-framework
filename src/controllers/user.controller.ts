import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "../decorators";
import { logger } from "../utils/logger";

@Controller("users")
export class UserController {
  private users: any[] = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
    { id: 3, name: "Jane Smith1", email: "jane1@example.com" },
  ];

  @Get()
  getAllUsers(@Query("sort") sort?: string) {
    if (sort === "name") {
      return [...this.users].sort((a, b) => a.name.localeCompare(b.name));
    }
    return this.users;
  }

  @Get(":id")
  getUserById(@Param("id") id: string) {
    const user = this.users.find((u) => u.id === parseInt(id));
    logger.debug("获取用户详情:", user);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  @Post()
  createUser(@Body() userData: any) {
    const newUser = {
      id: this.users.length + 1,
      ...userData,
    };
    this.users.push(newUser);
    return newUser;
  }

  @Put(":id")
  updateUser(@Param("id") id: string, @Body() userData: any) {
    const index = this.users.findIndex((u) => u.id === parseInt(id));
    if (index === -1) {
      throw new Error("User not found");
    }

    this.users[index] = {
      ...this.users[index],
      ...userData,
      id: parseInt(id),
    };

    return this.users[index];
  }

  @Delete(":id")
  deleteUser(@Param("id") id: string) {
    const index = this.users.findIndex((u) => u.id === parseInt(id));
    if (index === -1) {
      throw new Error("User not found");
    }

    const deletedUser = this.users[index];
    this.users.splice(index, 1);
    return deletedUser;
  }
}
