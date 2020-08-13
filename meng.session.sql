-- ----------------------------
-- Table structure for file
-- ----------------------------
DROP TABLE IF EXISTS `file`;
CREATE TABLE `file` (
  `FileID` int(10) NOT NULL AUTO_INCREMENT,
  `FileHash` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FilePath` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`FileID`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10040 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

CREATE TABLE dir (
  DirID int(10) NOT NULL primary key auto_increment,
  DirName varchar(100) not null,
  ParentID int(10) not null
)
