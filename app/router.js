module.exports = app => {
  const { router, controller } = app;
  // index.js
  router.post("/api/login", controller.manage.login);

  // 文件
  router.get("/api/getFiles", controller.manage.getFiles)
  router.post("/api/uploadFile", controller.manage.uploadFile)
  router.post("/api/deleteFile", controller.manage.deleteFile)
  router.post("/api/fileExist", controller.manage.fileExist)


}