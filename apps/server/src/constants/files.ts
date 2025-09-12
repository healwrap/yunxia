export const FILE_STATUS = {
  ACTIVE: 'active',
  TRASH: 'trash',
  // 注意：永久删除的文件直接从数据库中移除，不需要 DELETE 状态
} as const;
