/**
 * 自定义 Jest resolver，处理 ESM .js 扩展名到 .ts 的映射
 */
const path = require('path');
const fs = require('fs');

const sync = (request, options) => {
  // 只处理以 .js 结尾的相对路径导入
  if (request.endsWith('.js') && request.startsWith('.')) {
    const tsRequest = request.slice(0, -3) + '.ts';
    const resolvedTs = path.resolve(options.basedir, tsRequest);

    if (fs.existsSync(resolvedTs)) {
      return resolvedTs;
    }
  }

  // 默认解析
  return options.defaultResolver(request, options);
};

module.exports = sync;
