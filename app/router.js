module.exports = app => {
  const { router, controller } = app;
  // index.js
  router.post("/login", controller.manage.login);
  // DIR
  router.post("/saveDir",controller.manage.saveDir)
  // 文件
  router.get("/getSyncData", controller.manage.getSyncData)

  router.post("/uploadFile", controller.manage.uploadFile)
  router.post("/deleteFile", controller.manage.deleteFile)
  router.post("/fileExist", controller.manage.fileExist)
}