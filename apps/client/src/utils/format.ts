/**
 * 格式化文件大小，将字节转换为可读格式
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化日期时间为本地字符串
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期时间字符串
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 截断文件名，保留扩展名
 * @param filename 完整文件名
 * @param maxLength 最大长度
 * @returns 截断后的文件名
 */
export const truncateFilename = (filename: string, maxLength: number = 20): string => {
  if (filename.length <= maxLength) return filename;

  const extension = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '';

  const nameWithoutExt = filename.slice(0, filename.length - extension.length);
  const truncatedName = nameWithoutExt.slice(0, maxLength - 3 - extension.length);

  return `${truncatedName}...${extension}`;
};
