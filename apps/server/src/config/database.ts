import 'reflect-metadata';

import dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import { File } from '../entities/File';
import { Share } from '../entities/Share';
import { UserStorage } from '../entities/UserStorage';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'yunxia',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  entities: [File, Share, UserStorage],
  migrations: [],
  subscribers: [],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};
