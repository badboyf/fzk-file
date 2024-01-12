### docker启动

```bash
docker run --rm -d --name mongo -p 27017:27017 -v /root/docker/mongo/data/db:/data/db -v /root/docker/mongo/data/conf:/data/conf  mongo:4.2.8 -f /data/conf/mongodb.conf

docker exec -it mongo /bin/bash
mongo

# 创建用户
db.createUser({ user: 'root', pwd: 'root', roles: [ { role: "userAdminAnyDatabase", db: "admin" } ] });
db.auth("root","root"); # 返回1说明成功
db.createUser({ user: 'fzk', pwd: 'root', roles: [ { role: "readWrite", db: "fzk" } ] });

# 测试用户登录
docker exec -it mongo  mongo admin

use fzk
db.fzk.save({});

#常用命令
#连接
mongo --host 127.0.0.1 --port 27018 -u root -p root
show dbs
show collections
show users
use <db name>  #切换当前数据库，如果数据库不存在则创建数据库。
db.help()
db.foo.help()

> db.dropDatabase()  #删除当前使用数据库
> db.cloneDatabase("127.0.0.1")   #将指定机器上的数据库的数据克隆到当前数据库
> db.copyDatabase("mydb", "temp", "127.0.0.1")  #将本机的mydb的数据复制到temp数据库中
> db.repairDatabase()  #修复当前数据库> db.getName()  #查看当前使用的数据库，也可以直接用db
> db.stats()  #显示当前db状态
> db.version()  #当前db版本> db.getMongo()  ＃查看当前db的链接机器地址
> db.serverStatus()  #查看数据库服务器的状态
```

### 配置

```
# mongodb.conf
port=27017
dbpath=/data/db
#logpath=/data/log
logappend=true
# docker启动，后台启动的话会导致容器消亡
#fork=true
maxConns=100
#不启用验证
#noauth=true
#每次写入会记录一条操作日志
journal=true
#存储引擎有mmapv1、wiredTiger、mongorocks
#storageEngine=wiredTiger
#访问IP
bind_ip=0.0.0.0
```

### 创建用户时的角色说明

```bash
角色说明： 
Read：允许用户读取指定数据库 
readWrite：允许用户读写指定数据库 
dbAdmin：允许用户在指定数据库中执行管理函数，如索引创建、删除，查看统计或访问system.profile 
userAdmin：允许用户向system.users集合写入，可以找指定数据库里创建、删除和管理用户 
clusterAdmin：只在admin数据库中可用，赋予用户所有分片和复制集相关函数的管理权限。 
readAnyDatabase：只在admin数据库中可用，赋予用户所有数据库的读权限 
readWriteAnyDatabase：只在admin数据库中可用，赋予用户所有数据库的读写权限 
userAdminAnyDatabase：只在admin数据库中可用，赋予用户所有数据库的userAdmin权限 
dbAdminAnyDatabase：只在admin数据库中可用，赋予用户所有数据库的dbAdmin权限。 
root：只在admin数据库中可用。超级账号，超级权限
```

