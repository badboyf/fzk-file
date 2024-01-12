### 安装

#### 安装zk

目录说明

```bash
log文件位置：
zk /opt/soft/zookeeper/log
ck /var/log/clickhouse-server

服务目录：
ZK: /opt/soft/zookeeper/
CK: /etc/clickhouse-server  /etc/clickhouse-client

Maven3: /usr/local/maven
```

安装: jdk zk ch

准备

```bash
# 每个节点 /etc/hosts
172.16.132.201 node1
172.16.132.202 node2
172.16.132.203 node3
```

安装jdk

```bash
# /opt/soft/java
cd /opt/soft/
cp /root/build_data/project/java.tar.gz /opt/soft
tar -zxvf java.tar.gz

# 配置环境变量
# JAVA_HOME
export JAVA_HOME=/opt/soft/java/jdk1.8.0_251
export PATH=$PATH:$JAVA_HOME/bin
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

source /etc/profile
```

安装zk

```bash
# 下载地址
https://zookeeper.apache.org/releases.html
http://archive.apache.org/dist/zookeeper

# /opt/soft/zookeeper
cd /opt/soft/
cp /root/build_data/project/apache-zookeeper-3.6.0-bin.tar.gz ./
tar -zxvf apache-zookeeper-3.6.0-bin.tar.gz
mv apache-zookeeper-3.6.0-bin zookeeper
cd zookeeper
# 创建data目录
mkdir /opt/soft/zookeeper/zkdata
# 每个节点设置id
echo 1 > /opt/soft/zookeeper/zkdata/myid
# 配置文件 /opt/soft/zookeeper/conf/zoo.cfg
cp zoo_sample.cfg zoo.cfg

# 准备配置文件，如下 zookeeper/conf/zoo.cfg
tickTime=2000
initLimit=10
syncLimit=5
#maxClientCnxns=60
#autopurge.purgeInterval=1
dataDir=/opt/soft/zookeeper/zkdata
dataLogDir=/opt/soft/zookeeper/log
clientPort=2181
server.1=node1:2888:3888
server.2=node2:2888:3888
server.3=node3:2888:3888

启动
./zkServer.sh start
```

安装ch

```bash

# 安装如下包
clickhouse-client-20.8.3.18-1.el7.x86_64.rpm
clickhouse-common-static-20.8.3.18-1.el7.x86_64.rpm
clickhouse-server-20.8.3.18-1.el7.x86_64.rpm
clickhouse-server-common-20.8.3.18-1.el7.x86_64.rpm
#安装
rpm -ivh *

# 配置文件分别拷贝到对应目录
/etc/clickhouse-server/user.xml
/etc/clickhouse-server/config.xml
/etc/meitrika.xml
# 修改 /etc/meitrika.xml 下部分，与当前服务器对应
<macros>
<!-- 跟本机Hostname或ip地址 -->
    <shard>shard2</shard>
    <replica>node2</replica>
</macros>

# 启动
clickhouse start
# 查看启动
clickhouse status

# 连接
clickhouse-client -m -h 127.0.0.1 --port 9000 -u default --password=Nx8lzHDT
clickhouse-client -m  -u ck_download --password=z5gtDDpl1xc_E4

# 测试创建表
CREATE TABLE a on cluster default ( `pdate` Date ) 
ENGINE = ReplicatedMergeTree('/clickhouse/tables/default/a/{shard}','{replica}') PARTITION BY toYYYYMM(pdate) ORDER BY pdate SETTINGS index_granularity = 8192

-- drop table a on cluster default;

```



### 常用命令

```shell
service clickhouse-server start
sudo /etc/init.d/clickhouse-server start

clickhouse-client --query "CREATE DATABASE IF NOT EXISTS tutorial"
clickhouse-client -m --user=default --password 
```

### 时间转化

```sql
fromUnixTimestamp64Nano
fromUnixTimestamp64Micro
fromUnixTimestamp64Milli
toUnixTimestamp64Nano
toUnixTimestamp64Micro
toUnixTimestamp64Milli
toUnixTimestamp   
parseDateTimeBestEffort(toString(dt_int))    2020101 -> DateTime

SELECT now() AS dt, toYYYYMMDDhhmmss(dt) AS dt_int, toString(dt) AS dt_str, parseDateTimeBestEffort(toString(dt_int)) AS datetime
┌──────────────────dt─┬─────────dt_int─┬─dt_str──────────────┬────────────datetime─┐
│ 2020-07-28 10:32:52 │ 20200728103252 │ 2020-07-28 10:32:52 │ 2020-07-28 10:32:52 │
└─────────────────────┴────────────────┴─────────────────────┴─────────────────────┘

select now64() dt,toUnixTimestamp(dt) ut,toDateTime(ut) datetime;
┌──────────────────────dt─┬─────────ut─┬────────────datetime─┐
│ 2020-07-28 10:34:25.161 │ 1595903665 │ 2020-07-28 10:34:25 │
└─────────────────────────┴────────────┴─────────────────────

-- 格式化
SELECT formatDateTime(order_time,'%Y-%m-%d-%H-%M-%S') as time
```

sql

```sql
-- 5秒一个时间段，取时间段的开始时间展示
select 
	toDateTime(toStartOfInterval(created_time, INTERVAL 5 second))
from xxx

clickhouse-client -h localhost --port 9000 --user default --password -m
```

 

