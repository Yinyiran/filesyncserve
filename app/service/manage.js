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
    let paramArr = [];
    let servePaths = [];
    const { body, files } = ctx.request;
    let connect = this.app.mysql
    try {
      for (const file of files) {
        const name = file.filename.toLowerCase();
        let ext = name.slice(name.lastIndexOf("."));
        let newName = new Date().getTime() + ext
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
        servePaths.push(serPath)
        paramArr.push(`(null, ${connect.escape(body[file.field])} , '${serPath}')`);
      }
      let query = `insert into file values ${paramArr.join()}`
      await connect.query(query);
    } finally {
      await ctx.cleanupRequestFiles();// delete those request tmp files
    }
    return servePaths;
  }

  async deleteFile(path) {
    await this.app.mysql.delete("file", { FilePath: path })
    let fullPath = Path.join(this.config.baseDir, path);
    return FS.unlinkSync(fullPath);
  }
}

module.exports = ManageService;