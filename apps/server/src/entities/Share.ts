import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { File } from './File';

@Entity('shares')
export class Share {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  file_id: string;

  @Column({ type: 'uuid', unique: true })
  share_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expired_at: Date | null;

  @Column({ type: 'integer', default: 0 })
  access_count: number;

  @CreateDateColumn()
  created_at: Date;

  // 关联文件实体
  @ManyToOne(() => File)
  @JoinColumn({ name: 'file_id' })
  file: File;
}
