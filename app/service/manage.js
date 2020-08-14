const Service = require("egg").Service;
const FS = require('fs');
const Path = require('path');
const Pump = require('mz-modules/pump');
const UtilService = require("../../service/utile")

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
    let servePaths = [];
    const { body, files } = ctx.request;
    try {
      for (const file of files) {
        const name = file.filename.toLowerCase();
        let newName = new Date().getTime() + name.slice(name.lastIndexOf("."));
        let basePath = UtilService[`${body.type}Path`];
        let dir = Path.join(this.config.baseDir, basePath);
        try {
          FS.accessSync(dir);
        } catch (error) {
          FS.mkdirSync(dir);
        }
        const source = FS.createReadStream(file.filepath);
        const target = FS.createWriteStream(Path.join(dir, newName));
        await Pump(source, target);
        let serPath = Path.join(basePath, newName).replace(/\\/g, "/");
        await this.savefile()
        servePaths.push(serPath);
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