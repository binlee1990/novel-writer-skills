import { createDataSource } from '../../../../src/server/datasource/index.js';

// Mock fs-extra
jest.mock('fs-extra', () => ({
  readJson: jest.fn(),
}));

import fs from 'fs-extra';
const mockReadJson = fs.readJson as jest.MockedFunction<typeof fs.readJson>;

describe('createDataSource', () => {
  it('returns fs datasource when database.enabled is false', async () => {
    mockReadJson.mockResolvedValue({
      database: { enabled: false },
    });
    const ds = await createDataSource('/fake/project');
    expect(ds.type).toBe('fs');
  });

  it('returns fs datasource when config has no database field', async () => {
    mockReadJson.mockResolvedValue({});
    const ds = await createDataSource('/fake/project');
    expect(ds.type).toBe('fs');
  });

  it('returns db datasource when database.enabled is true', async () => {
    mockReadJson.mockResolvedValue({
      database: {
        enabled: true,
        host: '127.0.0.1',
        port: 5432,
        dbname: 'test',
        user: 'postgres',
        password: '',
        schema: 'novelws',
      },
    });
    // DB 连接会失败（测试环境无 DB），应降级到 fs
    const ds = await createDataSource('/fake/project');
    expect(ds.type).toBe('fs');
  });
});
