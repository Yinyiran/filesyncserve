const Service = require("egg").Service;
const FS = require('fs');
const Path = require('path');
const Pump = require('mz-modules/pump');
const UtilService = require("../../service/utile")
const sendToWormhole = require('stream-wormhole');
// const awaitWriteStream = require('await-stream-ready').write;

class ManageService extends Service {
  async login(param) {
    const compinfo = await this.app.mysql.get('compinfo');
    if (param.UserName === compinfo.UserName) {
      if (param.PassWord === compinfo.PassWord) {
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  }

  saveDir(param) {
    const { DirID } = param
    if (DirID > 0) {
      return this.app.mysql.update("dir", param, { where: { DirID } })
    } else {
      return this.app.mysql.insert("dir", param)
    }
  }
  delDir(dirid) {
    // await this.app.mysql.delete("dir", { DirID: dirid })
    return this.app.mysql.delete("dir", { where: { DirID: dirid } });
  }
  getDirs(parentId) {
    return this.app.mysql.select("dir", { where: { ParentID: parentId } });
  }

  getDirFiles(dirID) {
    return this.app.mysql.select("file", { where: { DirID: dirID } })
  }

  async getFiles(path) {
    let allFiles = [];
    let getFile = (path) => {
      let arr = FS.readdirSync(path)
      arr.forEach(item => {
        let itemPath = Path.join(path, item)
        let state = FS.statSync(Path.join(this.config.baseDir, itemPath))
        if (state.isDirectory()) getFile(itemPath)
        else allFiles.push(itemPath.replace(/\\/g, "/"));
      })
    };
    getFile(path)
    return allFiles;
  }

  async fileExist(hashs) {
    let list = await this.app.mysql.select('file', { where: { FileHash: hashs } });
    let res = {}
    list.forEach(item => {
      res[item.FileHash] = item.FilePath;
    });
    return res;
  }

  async uploadFile(ctx) {
    const { body, files } = ctx.request;

    const stream = await ctx.getFileStream();
    const fileName = stream.filename;

    let target = path.join(this.config.baseDir, `app/public/comfiles/${stream.filename}`);
    const result = await new Promise((resolve, reject) => {
      const remoteFileStream = fs.createWriteStream(target);
      stream.pipe(remoteFileStream);
      let errFlag;
      remoteFileStream.on('error', err => {
        errFlag = true;
        sendToWormhole(stream);
        remoteFileStream.destroy();
        reject(err);
      });

      remoteFileStream.on('finish', async () => {
        if (errFlag) return;
        resolve({ fileName, name: stream.fields.name });
      });
    });
    return result;  

    let servePaths = [];
    const parts = ctx.multipart();
    let files2 = [];
    let part;
    // parts() 返回 promise 对象
    while ((part = await parts()) != null) {
      if (part.length) {
        // 这是 busboy 的字段
        console.log('field: ' + part[0]);
        console.log('value: ' + part[1]);
        console.log('valueTruncated: ' + part[2]);
        console.log('fieldnameTruncated: ' + part[3]);
      } else {
        // 这时是用户没有选择文件就点击了上传(part 是 file stream，但是 part.filename 为空)
        // 需要做出处理，例如给出错误提示消息
        if (!part.filename) throw "上传参数不对";

        // // part 是上传的文件流
        // console.log('field: ' + part.fieldname);
        // console.log('filename: ' + part.filename);
        // console.log('encoding: ' + part.encoding);
        // console.log('mime: ' + part.mime);
        // 文件处理，上传到云存储等等
        try {
          // result = await ctx.oss.put('egg-multipart-test/' + part.filename, part);
          const filename = stream.filename.toLowerCase();
          const target = path.join(this.config.baseDir, 'resource/file', filename);
          const writeStream = fs.createWriteStream(target);
          await pump(stream, writeStream);
          files2.push(filename);
        } catch (err) {
          // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
          await sendToWormhole(part);
          throw err;
        }
      }
      return files2;
    }
    try {
      for (const file of parts) {
        // const name = file.filename.toLowerCase();
        // let newName = new Date().getTime() + name.slice(name.lastIndexOf("."));
        // let basePath = UtilService[`${body.type}Path`];
        // let dir = Path.join(this.config.baseDir, basePath);
        // 生成文件名
        const filename = `${Date.now()}${Number.parseInt(
          Math.random() * 1000,
        )}${path.extname(stream.filename).toLocaleLowerCase()}`;
        // 生成文件夹
        const dirname = dayjs(Date.now()).format('YYYY/MM/DD');
        function mkdirsSync(dirname) {
          if (fs.existsSync(dirname)) {
            return true;
          } else {
            if (mkdirsSync(path.dirname(dirname))) {
              fs.mkdirSync(dirname);
              return true;
            }
          }
        }
        mkdirsSync(path.join(uplaodBasePath, category, dirname));
        // 生成写入路径
        const target = path.join(uplaodBasePath, category, dirname, filename);
        // 写入流
        const writeStream = fs.createWriteStream(target);
        try {
          //异步把文件流 写入
          await awaitWriteStream(stream.pipe(writeStream));
        } catch (err) {
          //如果出现错误，关闭管道
          await sendToWormhole(stream);
          this.error();
        }
        // try {
        //   FS.accessSync(dir);
        // } catch (error) {
        //   FS.mkdirSync(dir);
        // }
        // const source = FS.createReadStream(file.filepath);
        // const target = FS.createWriteStream(Path.join(dir, newName));
        // await Pump(source, target);
        // let serPath = Path.join(basePath, newName).replace(/\\/g, "/");
        // await this.savefile()
        // servePaths.push(serPath);
      }
    }
    catch (err) {
      console.log(err);
    } finally {
      await ctx.cleanupRequestFiles();// delete those request tmp files
      return servePaths;
    }
  }

  async saveFile(files) {
    let connect = this.app.mysql;
    let updateArr = [], newArr = [];
    files.forEach(item => {
      let { FileID, FileName, FileHash, DirID, ModifyTime, ServePath, FileSize, } = item;
      let str = `${FileName}, ${FileHash}, ${DirID}, ${ServePath}, ${FileSize}, ${ModifyTime}`;
      if (FileID) updateArr.push(`(${FileID},${str})`);
      else newArr.push(`(${str})`)
    })
    if (updatArr.length > 0) {
      let query = `insert into file (FileName, FileHash, DirID, ServePath, FileSize ModifyTime) values ${updatArr.join()}`
      await connect.query(query);
    }
    if (newarr.length > 0) {
      let query = `insert into file (FileID, FileHash, DirID, ServePath, FileSize, ModifyTime) values ${updatArr.join()} ON DUPLICATE KEY UPDATE 
      FileHash=VALUES(FileHash), DirID=VALUES(DirID), ServePath=VALUES(ServePath), FileSize=VALUES(FileSize), ModifyTime=VALUES(ModifyTime)`
      await connect.query(query);
    }
    // INSERT into`table`(id, fruit)
    // VALUES(1, 'apple'), (2, 'orange'), (3, 'peach')
    // ON DUPLICATE KEY UPDATE fruit = VALUES(fruit);

    // UPDATE table
    // SET column2 = (CASE column1 WHEN 1 THEN 'val1'
    // WHEN 2 THEN 'val2'
    // WHEN 3 THEN 'val3'
    // END)
    // WHERE column1 IN(1, 2, 3);
  }

  async deleteFile(path) {
    await this.app.mysql.delete("file", { FilePath: path })
    let fullPath = Path.join(this.config.baseDir, path);
    return FS.unlinkSync(fullPath);
  }
}

module.exports = ManageService;