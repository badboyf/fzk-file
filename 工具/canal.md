# canal 单机docker安装

下载镜像

```shell
docker pull mysql:5.7.11
docker pull canal/canal-server
docker pull canal/canal-admin
```

canal-admin 图形界面，cannal-server 真正的server端。在两个脚本文件

```shell
wget https://github.com/alibaba/canal/blob/master/docker/run.sh
wget https://github.com/alibaba/canal/blob/master/docker/run_admin.sh
```

## mysql

### 启动

创建my.cnf

```shell

[client]
port        = 3306
socket      = /var/run/mysqld/mysqld.sock

[mysqld_safe]
pid-file    = /var/run/mysqld/mysqld.pid
socket      = /var/run/mysqld/mysqld.sock
nice        = 0

[mysqld]
skip-host-cache
skip-name-resolve
user        = mysql
pid-file    = /var/run/mysqld/mysqld.pid
socket      = /var/run/mysqld/mysqld.sock
port        = 3306
basedir     = /usr
datadir     = /var/lib/mysql
tmpdir      = /tmp
lc-messages-dir = /usr/share/mysql
explicit_defaults_for_timestamp

log-bin=mysql-bin # 开启 binlog
binlog-format=ROW # 选择 ROW 模式
server_id=1

symbolic-links=0
!includedir /etc/mysql/conf.d/
```

启动mysql容器，能让上面的my.cnf替换容器里的/etc/mysql/my.cnf

```shell
docker run -d -p 3306:3306 --privileged=true --name mysql \
 -v /Users/fengzhikui/docker/mysql/conf:/etc/mysql \
 -v /Users/fengzhikui/docker/mysql/logs:/var/log/mysql \
 -v /Users/fengzhikui/docker/mysql/data:/var/lib/mysql \
 -e MYSQL_ROOT_PASSWORD=123456 \
 -d mysql:5.7.11
```

### 用户权限

进入容器

```shell
docker exec -it mysql /bin/bash
```

创建用户和权限。root用户密码设为123456，创建canal用户密码为canal

```
mysql
update user set authentication_string=PASSWORD("123456") where user='root';
update user set plugin="mysql_native_password";

CREATE USER canal IDENTIFIED BY 'canal';
GRANT ALL PRIVILEGES ON *.* TO 'canal'@'%' ;
FLUSH PRIVILEGES;

quit;
```

## 先启动canal-admin

```shell
docker run -d -it --name=canal-admin \ 
-e server.port=8089 \
-e canal.adminUser=admin \
-e canal.adminPasswd=admin \
-p 8089:8089 \
-m 1024m canal/canal-admin
```

或者

```shell
sh  run_admin.sh -e server.port=8089 \
         -e canal.adminUser=admin \
         -e canal.adminPasswd=admin
```

本地打开http://localhost:8089，输入用户名：admin, 密码：123456，可以看见admin的UI

## 启动 canal-server

启动命令

```shell
docker run --rm -d -it \
--privileged=true \
--name=canal-server \
--link canal-admin:canal-admin \
--link mysql:mysql \
-v /Users/fengzhikui/docker/canal/data:/tmp-share/ \
-e canal.instance.master.address=mysql:3306 \
-e canal.admin.manager=canal-admin:8089  \
-e canal.admin.port=11110 \
-e canal.admin.user=admin \
-e canal.admin.passwd=4ACFE3202A5FF5CF467898FC58AAB1D615029441 \
-e canal.destinations=example \
-p 11110:11110 \
-p 11111:11111 \
-p 11112:11112 \
-p 9100:9100 \
-m 4096m \
canal/canal-server
```

测试Java类

```java

import com.alibaba.otter.canal.client.impl.SimpleCanalConnector;
import com.alibaba.otter.canal.protocol.CanalEntry.Column;
import com.alibaba.otter.canal.protocol.CanalEntry.Entry;
import com.alibaba.otter.canal.protocol.CanalEntry.EntryType;
import com.alibaba.otter.canal.protocol.CanalEntry.EventType;
import com.alibaba.otter.canal.protocol.CanalEntry.RowChange;
import com.alibaba.otter.canal.protocol.CanalEntry.RowData;
import com.alibaba.otter.canal.protocol.Message;

import java.net.InetSocketAddress;
import java.util.List;


public class CanalT {

    public static void main(String args[]) throws InterruptedException {
        String hostname = "127.0.0.1";
        int port = 11111;
        String destination = "example";
        String username = "canal";
        String password = "canal";
        Integer soTimeout = 6000;

        SimpleCanalConnector connector = new SimpleCanalConnector(new InetSocketAddress(hostname, port), destination, username, password, soTimeout);
        connector.setSoTimeout(soTimeout);
        connector.setIdleTimeout(60 * 60 * 1000);
        int batchSize = 1000;
        int emptyCount = 0;
        try {
            connector.connect();
            connector.subscribe(".*\\..*");
            connector.rollback();
            while (true) {
                Message message = connector.getWithoutAck(batchSize); // 获取指定数量的数据
                long batchId = message.getId();
                int size = message.getEntries().size();
                if (batchId == -1 || size == 0) {
                    emptyCount++;
                    System.out.println("empty count : " + emptyCount);
                    Thread.sleep(2000);
                } else {
                    emptyCount = 0;
                    // System.out.printf("message[batchId=%s,size=%s] \n", batchId, size);
                    printEntry(message.getEntries());
                }

                connector.ack(batchId); // 提交确认
                // connector.rollback(batchId); // 处理失败, 回滚数据
            }
        } finally {
            connector.disconnect();
        }
    }

    private static void printEntry(List<Entry> entrys) {
        for (Entry entry : entrys) {
            if (entry.getEntryType() == EntryType.TRANSACTIONBEGIN || entry.getEntryType() == EntryType.TRANSACTIONEND) {
                continue;
            }

            RowChange rowChage = null;
            try {
                rowChage = RowChange.parseFrom(entry.getStoreValue());
            } catch (Exception e) {
                throw new RuntimeException("ERROR ## parser of eromanga-event has an error , data:" + entry.toString(),
                        e);
            }

            EventType eventType = rowChage.getEventType();
            System.out.println(String.format("================&gt; binlog[%s:%s] , name[%s,%s] , eventType : %s",
                    entry.getHeader().getLogfileName(), entry.getHeader().getLogfileOffset(),
                    entry.getHeader().getSchemaName(), entry.getHeader().getTableName(),
                    eventType));

            for (RowData rowData : rowChage.getRowDatasList()) {
                if (eventType == EventType.DELETE) {
                    printColumn(rowData.getBeforeColumnsList());
                } else if (eventType == EventType.INSERT) {
                    printColumn(rowData.getAfterColumnsList());
                } else {
                    System.out.println("-------&gt; before");
                    printColumn(rowData.getBeforeColumnsList());
                    System.out.println("-------&gt; after");
                    printColumn(rowData.getAfterColumnsList());
                }
            }
        }
    }

    private static void printColumn(List<Column> columns) {
        for (Column column : columns) {
            System.out.println(column.getName() + " : " + column.getValue() + "    update=" + column.getUpdated());
        }
    }
}

```

这时在UI中可以看见有个server已经连上

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201204171358369.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2Nwb25nbzM=,size_16,color_FFFFFF,t_70)

此时如果运行测试类会报错：destination:canal should start first。但是没有默认的实例，需要在控制台创建名为 'canal' 的实例。

```java
Exception in thread "main" com.alibaba.otter.canal.protocol.exception.CanalClientException: failed to subscribe with reason: something goes wrong with channel:[id: 0x0e08e006, /172.17.0.1:42602 => /172.17.0.5:11111], exception=com.alibaba.otter.canal.server.exception.CanalServerException: destination:canal should start first

	at com.alibaba.otter.canal.client.impl.SimpleCanalConnector.subscribe(SimpleCanalConnector.java:249)
	at com.fzk.canal.CanalT.main(CanalT.java:34)

```

创建canal实例

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201204171608648.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2Nwb25nbzM=,size_16,color_FFFFFF,t_70)

根据模板创建，需要修改的已经标记。完成后点击保存

![image-20201204171742467](/Users/fengzhikui/Library/Application Support/typora-user-images/image-20201204171742467.png)



报错：destination:canal111111 should start first。就是destination还未创建，

```
Exception in thread "main" com.alibaba.otter.canal.protocol.exception.CanalClientException: failed to subscribe with reason: something goes wrong with channel:[id: 0x25809b82, /172.17.0.1:42638 => /172.17.0.5:11111], exception=com.alibaba.otter.canal.server.exception.CanalServerException: destination:canal111111 should start first

	at com.alibaba.otter.canal.client.impl.SimpleCanalConnector.subscribe(SimpleCanalConnector.java:249)
	at com.fzk.canal.CanalT.main(CanalT.java:34)

```

