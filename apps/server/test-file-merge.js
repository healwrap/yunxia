/**
 * 测试文件合并逻辑的脚本
 * 用于验证修复后的文件合并是否正确
 */

const fs = require('fs');
const path = require('path');

// 模拟创建测试分片
async function createTestChunks() {
  const testDir = path.join(__dirname, 'test-chunks');
  const chunkDir = path.join(testDir, 'test-file-hash');

  // 创建目录
  await fs.promises.mkdir(chunkDir, { recursive: true });

  // 创建测试分片（按正确顺序）
  const chunks = ['chunk1-content-', 'chunk2-content-', 'chunk3-content-'];

  const chunkHashes = ['hash1', 'hash2', 'hash3'];

  // 写入分片文件
  for (let i = 0; i < chunks.length; i++) {
    await fs.promises.writeFile(path.join(chunkDir, chunkHashes[i]), chunks[i]);
  }

  // 创建状态文件
  const statusFile = {
    filename: 'test.txt',
    fileHash: 'test-file-hash',
    fileSize: chunks.join('').length,
    allChunks: chunkHashes,
    uploadedChunks: chunkHashes,
    userId: 'test-user',
    createdAt: new Date().toISOString(),
  };

  await fs.promises.writeFile(
    path.join(testDir, 'test-file-hash.json'),
    JSON.stringify(statusFile, null, 2)
  );

  console.log('测试文件创建完成:');
  console.log('- 分片目录:', chunkDir);
  console.log('- 状态文件:', path.join(testDir, 'test-file-hash.json'));
  console.log('- 期望合并结果:', chunks.join(''));

  return { testDir, statusFile, expectedContent: chunks.join('') };
}

// 运行测试
createTestChunks().catch(console.error);
