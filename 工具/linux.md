## 创建用户 sudo不用密码

```shell
useradd -s /bin/bash fzk
echo 'fzk     ALL=(ALL)       NOPASSWD:ALL' >> /etc/sudoers
```

### 只下载不安装

```
yum install --downloadonly --downloaddir=./tmp sl
yum -y localinstall *.rmp
```

vim 进入后强制保存

```
:w !sudo tee %
```

磁盘空间查看

```
du -h --max-depth=1 /home

```

查看端口是否可以连接
```shell
telnet 116.196.123.133  38233

```
