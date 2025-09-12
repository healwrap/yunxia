import { Repository } from 'typeorm';

import { AppDataSource } from '../config/database';
import { FILE_STATUS } from '../constants/files';
import { File } from '../entities/File';
import { UserStorage } from '../entities/UserStorage';

export class UserStorageService {
  private userStorageRepository: Repository<UserStorage>;
  private fileRepository: Repository<File>;

  constructor() {
    this.userStorageRepository = AppDataSource.getRepository(UserStorage);
    this.fileRepository = AppDataSource.getRepository(File);
  }

  /**
   * 初始化用户存储信息
   * @param userId 用户ID
   * @param totalSpace 总空间，默认10GB
   */
  async initializeUserStorage(
    userId: string,
    totalSpace: bigint = 10737418240n // 10GB
  ): Promise<UserStorage> {
    // 检查用户存储是否已存在
    const existingStorage = await this.userStorageRepository.findOne({
      where: { user_id: userId },
    });

    if (existingStorage) {
      return existingStorage;
    }

    // 创建新的用户存储记录
    const userStorage = this.userStorageRepository.create({
      user_id: userId,
      total_space: totalSpace.toString(),
      used_space: '0',
    });

    return await this.userStorageRepository.save(userStorage);
  }

  /**
   * 获取用户存储信息
   * @param userId 用户ID
   */
  async getUserStorage(userId: string): Promise<UserStorage | null> {
    return await this.userStorageRepository.findOne({
      where: { user_id: userId },
    });
  }

  /**
   * 更新用户已使用空间
   * @param userId 用户ID
   * @param sizeChange 空间变化量（正数为增加，负数为减少）
   */
  async updateUsedSpace(userId: string, sizeChange: bigint): Promise<UserStorage> {
    const storage = await this.getUserStorage(userId);
    if (!storage) {
      throw new Error('用户存储信息不存在');
    }

    const currentUsedSpace = BigInt(storage.used_space);
    const newUsedSpace = currentUsedSpace + sizeChange;

    // 确保已使用空间不为负数
    if (newUsedSpace < 0n) {
      storage.used_space = '0';
    } else {
      storage.used_space = newUsedSpace.toString();
    }

    storage.updated_at = new Date();
    return await this.userStorageRepository.save(storage);
  }

  /**
   * 检查用户是否有足够空间上传文件
   * @param userId 用户ID
   * @param requiredSpace 需要的空间
   */
  async checkSpaceAvailable(userId: string, requiredSpace: bigint): Promise<boolean> {
    const storage = await this.getUserStorage(userId);
    if (!storage) {
      return false;
    }
    return storage.hasEnoughSpace(requiredSpace);
  }

  /**
   * 重新计算用户已使用空间
   * 基于数据库中的文件记录重新计算
   * @param userId 用户ID
   */
  async recalculateUsedSpace(userId: string): Promise<UserStorage> {
    // 计算用户所有非文件夹且状态为active的文件总大小
    const result = await this.fileRepository
      .createQueryBuilder('file')
      .select('SUM(file.size)', 'total_size')
      .where('file.user_id = :userId', { userId })
      .andWhere('file.is_folder = :isFolder', { isFolder: false })
      .andWhere('file.status = :status', { status: FILE_STATUS.ACTIVE })
      .getRawOne();

    const totalSize = result.total_size ? BigInt(result.total_size) : 0n;

    const storage = await this.getUserStorage(userId);
    if (!storage) {
      throw new Error('用户存储信息不存在');
    }

    storage.used_space = totalSize.toString();
    storage.updated_at = new Date();
    return await this.userStorageRepository.save(storage);
  }

  /**
   * 获取用户存储统计信息
   * @param userId 用户ID
   */
  async getStorageStats(userId: string) {
    const storage = await this.getUserStorage(userId);
    if (!storage) {
      throw new Error('用户存储信息不存在');
    }

    // 获取文件类型统计
    const fileTypeStats = await this.fileRepository
      .createQueryBuilder('file')
      .select(['file.type as type', 'COUNT(*) as count', 'SUM(file.size) as size'])
      .where('file.user_id = :userId', { userId })
      .andWhere('file.is_folder = :isFolder', { isFolder: false })
      .andWhere('file.status = :status', { status: FILE_STATUS.ACTIVE })
      .groupBy('file.type')
      .getRawMany();

    // 处理文件类型分类
    const processedStats = fileTypeStats.map(stat => {
      const type = this.getFileCategory(stat.type);
      return {
        type,
        count: parseInt(stat.count),
        size: parseInt(stat.size || '0'),
      };
    });

    // 按类型合并统计
    const mergedStats = processedStats.reduce(
      (acc, stat) => {
        const existing = acc.find(item => item.type === stat.type);
        if (existing) {
          existing.count += stat.count;
          existing.size += stat.size;
        } else {
          acc.push(stat);
        }
        return acc;
      },
      [] as Array<{ type: string; count: number; size: number }>
    );

    return {
      totalSpace: BigInt(storage.total_space),
      usedSpace: BigInt(storage.used_space),
      availableSpace: storage.available_space,
      usagePercentage: storage.usage_percentage,
      fileTypeStats: mergedStats,
    };
  }

  /**
   * 根据MIME类型获取文件分类
   * @param mimeType MIME类型
   */
  private getFileCategory(mimeType: string): string {
    if (!mimeType) return 'other';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('doc') ||
      mimeType.includes('txt') ||
      mimeType.includes('rtf')
    ) {
      return 'document';
    }
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
      return 'archive';
    }
    return 'other';
  }

  /**
   * 设置用户总空间
   * @param userId 用户ID
   * @param totalSpace 总空间
   */
  async setTotalSpace(userId: string, totalSpace: bigint): Promise<UserStorage> {
    const storage = await this.getUserStorage(userId);
    if (!storage) {
      throw new Error('用户存储信息不存在');
    }

    storage.total_space = totalSpace.toString();
    storage.updated_at = new Date();
    return await this.userStorageRepository.save(storage);
  }
}
