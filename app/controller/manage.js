const Controller = require("egg").Controller;

class ManageController extends Controller {
  // ------ 文件 -------
  // 根据filehash 判断文件是否已经上传
  async login() {
    const { ctx, service } = this;
    const loginState = await service.manage.login(ctx.request.body)
    if (loginState) {
      ctx.body = "登录成功"
    } else {
      ctx.status = 401
      ctx.body = "登录名或密码错误"
    }
  }
  async fileExist() {
    const { ctx, service } = this;
    ctx.body = await service.manage.fileExist(ctx.request.body)
  }
  // 上传文件
  async uploadFile() {
    const { ctx, service } = this;
    let servePaths = await service.manage.uploadFile(ctx)
    ctx.body = servePaths;
  }
  // 获取所有文件
  async getFiles() {
    const { ctx, service } = this;
    ctx.body = await service.manage.getAllFile(`resource/${ctx.query.type}`)
  }
  // 删除文件
  async deleteFile() {
    const { ctx, service } = this;
    ctx.body = service.manage.deleteFile(ctx.request.body.FilePath);
  }
}

module.exports = ManageController;