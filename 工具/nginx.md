centos安装

```shell
https://nginx.org/packages/centos/7/x86_64/RPMS/
wget http://rpmfind.net/linux/centos/7.9.2009/os/x86_64/Packages/pcre2-10.23-2.el7.x86_64.rpm
wget https://nginx.org/packages/centos/7/x86_64/RPMS/nginx-1.22.1-1.el7.ngx.x86_64.rpm

rpm -ivh pcre2-10.23-2.el7.x86_64.rpm
rpm -ivh nginx-1.22.1-1.el7.ngx.x86_64.rpm
```

```shell
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





```
server {
        listen		80;
        listen          443 ssl;
        server_name     xxx.fzk.com;
        access_log      logs/academy-api-edu.access.log  main;
        #access_log      logs/geoip.log  geoip;
        add_header Strict-Transport-Security "max-age=864000";
        ssl_certificate       servers/key/xxx.fzk.crt;
        ssl_certificate_key   servers/key/xxx.fzk.key;
        ssl_session_timeout  5m;
        ssl_prefer_server_ciphers   on;
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        ssl_ciphers  HIGH:!aNULL:!MD5:!EXPORT56:!EXP:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-RC4-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA:RC4-SHA:!aNULL:!eNULL:!EXPORT:!DES:!3DES:!MD5:!DSS:!PKS;
        ssl_session_cache builtin:1000 shared:SSL:10m;
	include deny.conf;
	include cookie.conf;
	
	      # websocket wss 配置
        location /socket.io {    
            proxy_pass https://xxxx.com/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade; # allow websockets
            proxy_set_header Connection "upgrade";
        }

	      # websocket wss 配置
        location /exec {
            proxy_pass https://xxxx.com;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade; # allow websockets
            proxy_set_header Connection "upgrade";
        }

        location / {
            proxy_pass http://127.0.0.1:9030;
        }

}
```

## proxy_pass  附带匹配路径问题

```
第一种：
location /proxy/ {
    proxy_pass http://127.0.0.1/;
}
代理到URL：http://127.0.0.1/test.html


第二种：
location /proxy/ {
    proxy_pass http://127.0.0.1;  #少/
}
代理到URL：http://127.0.0.1/proxy/test.html


第三种：
location /proxy/ {
    proxy_pass http://127.0.0.1/aaa/;
}
代理到URL：http://127.0.0.1/aaa/test.html


第四种（相对于第三种，最后少一个 / ）
location /proxy/ {
    proxy_pass http://127.0.0.1/aaa;
}
代理到URL：http://127.0.0.1/aaatest.html
```

```
- proxy_set_header  Host  $host;  作用web服务器上有多个站点时，用该参数header来区分反向代理哪个域名。比如下边的代码举例。
- proxy_set_header X-Forwarded-For  $remote_addr; 作用是后端服务器上的程序获取访客真实IP，从该header头获取。部分程序需要该功能。
```

### 负载均衡

```
    upstream core_tomcat {
      server 192.168.1.253:80      weight=5  max_fails=3 fail_timeout=30;
      server 192.168.1.252:80      weight=1  max_fails=3 fail_timeout=30;
      server 192.168.1.251:80      backup;
    }

    server {
        listen       80;
        server_name  www.jd.com;
        location /web {
            proxy_pass http://core_tomcat;
            proxy_set_header  Host  $host;
        }
    }
```

### Rewrite

1. Rewrite根据nginx提供的全局变量或自己设置的变量，结合正则表达式和标志位实现url重写和者重定向。
2. Rewrite和location类似，都可以实现跳转，区别是rewrite是在同一域名内更改url，而location是对同类型匹配路径做控制访问，或者proxy_pass代理到其他服务器。
3. Rewrite和location执行顺序：
   - 执行server下的rewrite
   - 执行location匹配
   - 执行location下的rewrite

```
rewrite        <regex>        <replacement>        <flag>;
 关键字        正则表达式         代替的内容         重写类型

Rewrite：一般都是rewrite
Regex：可以是字符串或者正则来表示想要匹配的目标URL
Replacement：将正则匹配的内容替换成replacement
Flag：flag标示，重写类型：
  - last：本条规则匹配完成后，继续向下匹配新的location URI规则；相当于Apache里德(L)标记，表示完成rewrite，浏览器地址栏URL地址不变；一般写在server和if中;
  - break：本条规则匹配完成后，终止匹配，不再匹配后面的规则，浏览器地址栏URL地址不变；一般使用在location中；
  - redirect：返回302临时重定向，浏览器地址会显示跳转后的URL地址；
  - permanent：返回301永久重定向，浏览器地址栏会显示跳转后的URL地址；
  
  
  
  server {
  # 访问 /last.html 的时候，页面内容重写到 /index.html 中，并继续后面的匹配，浏览器地址栏URL地址不变
  rewrite /last.html /index.html last;

  # 访问 /break.html 的时候，页面内容重写到 /index.html 中，并停止后续的匹配，浏览器地址栏URL地址不变；
  rewrite /break.html /index.html break;

  # 访问 /redirect.html 的时候，页面直接302定向到 /index.html中，浏览器地址URL跳为index.html
  rewrite /redirect.html /index.html redirect;

  # 访问 /permanent.html 的时候，页面直接301定向到 /index.html中，浏览器地址URL跳为index.html
  rewrite /permanent.html /index.html permanent;

  # 把 /html/*.html => /post/*.html ，301定向
  rewrite ^/html/(.+?).html$ /post/$1.html permanent;

  # 把 /search/key => /search.html?keyword=key
  rewrite ^/search\/([^\/]+?)(\/|$) /search.html?keyword=$1 permanent;
  
  # 把当前域名的请求，跳转到新域名上，域名变化但路径不变
  rewrite ^/(.*) http://www.jd.com/$1 permanent;
  }
```

