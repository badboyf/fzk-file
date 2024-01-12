华为云

ssh [root@117.78.7.138](http://root@117.78.7.138) -p 22222

KItK!eEY@nV2y8E



## Nginx:

```shell
方法一： 编译安装
nginx下载地址
链接: https://pan.baidu.com/s/1K_1H4kDwjgsNPTfV2cq7fA  密码: d4ew
http://nginx.org/download/

yum -y install gcc gcc-c++ autoconf automake make  pcre pcre-devel zlib zlib-devel openssl openssl-devel

tar -zxvf nginx-1.20.0.tar.gz
cd nginx-1.20.0

./configure \
--user=nginx \
--group=nginx \
--prefix=/usr/local/nginx \
--sbin-path=/usr/local/nginx/sbin/nginx \
--conf-path=/usr/local/nginx/conf/nginx.conf \
--pid-path=/var/run/nginx.pid \
--lock-path=/var/run/nginx.lock \
--error-log-path=/usr/local/nginx/log/error.log \
--http-log-path=/usr/local/nginx/log/access.log \
--with-http_gzip_static_module \
--with-http_stub_status_module \
--with-http_ssl_module \
--with-pcre \
--with-file-aio \
--with-http_realip_module \
--without-http_scgi_module \
--without-http_uwsgi_module \
--without-http_fastcgi_module

make && make install
useradd -s /sbin/nologin -M nginx
```

## git

```bash
yum install -y git

https://blog.csdn.net/mbuger/article/details/70226712
连接github报错：
  Cloning into 'golangcc'...
  ssh: connect to host github.com port 22: Connection refused
  fatal: Could not read from remote repository.

  Please make sure you have the correct access rights
  and the repository exists.

```

## 生成ssh-keygen

```bash
ssh-keygen -t rsa
ssh-keygen -t rsa -C "邮箱"
```

## Node

```
链接: https://pan.baidu.com/s/1NrqgPMlrKJl0MJ28yfDWmA  密码: uqme
cd /usr/local/src/
wget https://nodejs.org/dist/v12.18.0/node-v12.18.0-linux-x64.tar.gz

tar -zxvf node-v12.18.0-linux-x64.tar.gz
mv node-v12.18.0-linux-x64 /usr/local/node/

vim /etc/profile
export NODE_HOME=/usr/local/node
export PATH=$PATH:$NODE_HOME/bin

阿里源
npm config set registry https://registry.npm.taobao.org
```

## GO

```
yum install -y golang

包下载失败
go env -w GOPROXY=https://goproxy.cn,direct

```

## Python

```
链接: https://pan.baidu.com/s/14Fi_S3q9xLI9VX323xkXnw  密码: i0nq

yum install -y readline-devel gcc openssl-devel bzip2-devel

wget https://www.python.org/ftp/python/2.7.12/Python-2.7.12.tar.xz
tar -xJvf Python-2.7.12.tar.xz

cd /usr/local/src/
tar xvf Python-2.7.12.tar
cd /usr/local/src/Python-2.7.12


export LANGUAGE=en_US.UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
./configure --prefix=/usr/local/python2.7
make
make install
```

## Mysql

```shell
密码设置不上   Your password does not satisfy the current policy requirements
https://blog.csdn.net/zhanaolu4821/article/details/93622812

You must reset your password using ALTER USER statement before executing this statement.
https://blog.csdn.net/hj7jay/article/details/65626766

远程登录
https://blog.csdn.net/zhanduo0118/article/details/112167864

my.cnf
bind-address=0.0.0.0

update user set host = ‘%’ where user = ‘root’;
FLUSH PRIVILEGES;

中间要求改次密码
set global validate_password_policy=LOW;
alter user user() identified by "123456";

```

