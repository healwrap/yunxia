import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { FILE_STATUS } from '../constants/files';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  path: string;

  @Column({ type: 'bigint', default: 0 })
  size: number;

  @Column({ type: 'varchar', length: 255 })
  type: string;

  @Column({ type: 'boolean', default: false })
  is_folder: boolean;

  @Column({ type: 'varchar', length: 255 })
  user_id: string;

  @Column({ type: 'varchar', length: 20, default: FILE_STATUS.ACTIVE })
  status: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  md5: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
