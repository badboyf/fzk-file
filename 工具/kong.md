/usr/local/kong/nginx.conf

``` shell
http {
    include 'nginx-kong.conf';
}
```

/usr/local/kong/nginx-kong.conf

``` shell
init_by_lua_block {
    Kong = require 'kong'
    Kong.init()
}
server {
    server_name kong;
    listen 0.0.0.0:8000 reuseport backlog=16384;
    listen 0.0.0.0:8443 ssl http2 reuseport backlog=16384;
    rewrite_by_lua_block {
        Kong.rewrite()
    }

    access_by_lua_block {
        Kong.access()
    }
.....
}
server {
    server_name kong_admin;
    listen 127.0.0.1:8001 reuseport backlog=16384;
    listen 127.0.0.1:8444 ssl http2 reuseport backlog=16384;
......
}
```

插件生效, 要么修改

``` java
/usr/local/share/lua/5.1/kong/constants.lua
local plugins = {
  "jwt",
  .......
  -- "自定义的插件名",
}
```

要么 修改

``` java
/etc/kong/kong.conf
plugins = bundled,自定义插件名
```



