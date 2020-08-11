
const Path = require("path")
module.exports = appInfo => {
  const config = {
    // use for cookie sign key, should change to your own and keep security
    keys: appInfo.name + '_1523879140687_7825',
    // token
    security: {
      csrf: {
        headerName: 'x-csrf-token',// 自定义请求头
      }
    },
    static: {
      // 静态化访问前缀,如：`http://127.0.0.1:7001/static/images/logo.png`
      prefix: '/resource',
      dir: Path.join(appInfo.baseDir, 'resource'), // `String` or `Array:[dir1, dir2, ...]` 静态化目录,可以设置多个静态化目录
      // dynamic: true, // 如果当前访问的静态资源没有缓存，则缓存静态文件，和`preload`配合使用；
      // preload: false,
      // maxAge: 31536000, // in prod env, 0 in other envs
      // buffer: true, // in prod env, false in other envs
    },
    multipart: {
      mode: "file"
    },
    mysql: {
      client: {
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: 'kongwu123',
        database: 'filesync'
      },
      app: true,
      agent: false,
    },
    cluster: {
      listen: {
        port: 6000,
        hostname: '127.0.0.1',
      }
    }
  };
  return config;
};