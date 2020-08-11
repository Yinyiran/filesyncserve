/**
* 不同格式转换日期
* @param date
* @returns {Date}
* @constructor
*/
function dateParse(date) {
  if (!(date instanceof Date)) {
    if (typeof date === "number") {
      date = new Date(date);
    } else if (typeof date === "string" && date !== "") {
      // if (~date.indexOf("T")) {
      //    // date = date.replace("T", " ");
      //   //return new Date(Date.parse(date));
      // }
      date = date.replace(/\..+$/g, "");
      if ((/\d{4}[^\d]\d{1,2}$/).test(date)) {
        date = date + "/01";
      }
      if ((/\d{4}[^\d]\d{1,2}[^\d]\d{1,2}$/).test(date)) {
        date = date + " 00:00:00";
      }
      //加时区转换，底座中不带时区获取事件会有问题
      if ((/\d{4}[^\d]\d{1,2}[^\d]\d{1,2}[^\d]\d{1,2}[^\d]\d{1,2}[^\d]\d{1,2}$/).test(date)) {
        date = date + "+0800";
      }
      date = date.replace(/(\d{4}[^\d]\d{1,2}[^\d]\d{1,2})[^\d](\d{1,2}[^\d]\d{1,2}[^\d]\d{1,2}(\+|\-)\d{4})$/, "$1T$2");
      //单数组前补充0
      date = date.replace(/(^|[^\d])(\d)(?=[^\d]|$)/ig, "$10$2");
      date = date.replace(/[^\d:+\-T ]/g, "-");
      date = new Date(date);

    }
  }
  return date;
}
function dateFormat(date = new Date(), format = "yyyy-MM-dd") {
  if (!date) {
    return date;
  }
  if (typeof date === "string" && !date.trim()) {
    return "";
  }
  if (!format) {
    format = 'yyyy-MM-dd';
  }
  //修改为支持字符串格式的日期或date对象
  date = dateParse(date);

  let formats = {
    "y+": date.getFullYear(),
    "M+": date.getMonth() + 1,
    "d+": date.getDate(),
    "H+": date.getHours(),
    "m+": date.getMinutes(),
    "s+": date.getSeconds(),
    "w+": ["日", "一", "二", "三", "四", "五", "六"][date.getDay()]
  };
  Object.keys(formats).forEach((key) => {
    const item = formats[key];
    format = format.replace(eval("/" + key + "/g"), function (exp) {
      return (exp.length === 1) ? (item) : (("0" + item).substr(("0" + item).length - exp.length));
    });
  });
  return format;
}
module.exports = UtilService = {
  imgPath: `resource/img/${dateFormat()}`,
  filePath: `resource/file/${dateFormat()}`,
  dateParse,
  dateFormat
}
