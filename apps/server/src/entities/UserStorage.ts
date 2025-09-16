import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_storage')
export class UserStorage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  user_id: string;

  @Column({ type: 'bigint', default: 10737418240 }) // 默认10GB
  total_space: string;

  @Column({ type: 'bigint', default: 0 })
  used_space: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 计算可用空间
  get available_space(): bigint {
    return BigInt(this.total_space) - BigInt(this.used_space);
  }

  // 计算使用百分比
  get usage_percentage(): number {
    const total = BigInt(this.total_space);
    const used = BigInt(this.used_space);
    if (total === 0n) return 0;
    return Number((used * 100n) / total);
  }

  // 检查是否有足够空间
  hasEnoughSpace(requiredSpace: bigint): boolean {
    return this.available_space >= requiredSpace;
  }
}
