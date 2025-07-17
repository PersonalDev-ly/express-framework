import Redis from 'ioredis';
import { logger } from '../utils/logger';

// 从环境变量获取Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
};

// 创建Redis客户端
const redisClient = new Redis(redisConfig);

// 连接事件处理
redisClient.on('connect', () => {
  logger.info('Redis客户端已连接');
});

redisClient.on('error', (err) => {
  logger.error('Redis连接错误', { error: err.message });
});

export default redisClient;
