看 https://www.cnblogs.com/zhengah/p/5007938.html

用CA的私钥对socket服务端的公钥证书做签名。

```bash
openssl genrsa -out ca.key 1024
```

 （这里我们没有用des3加密。 可以增加一个-des3参数加密，详情可以man genrsa） 
		 这一步的时候需要在提示之下输入许多信息，包括国家代码，省份，城市，公司机构名等

```bash
openssl req -new -x509 -days 36500 -key ca.key -out ca.crt
```

生成server端的私钥key：

```bash
openssl genrsa -out server.key 1024 
```

 生成server端的req文件（这一步生成的req文件，包含公钥证书，外加身份信息，例如国家，省份，公司等。用它提交给ca，让ca来对它做签名 ）：

```bash
openssl req -new -key server.key -out server.csr 
```

用CA的私钥对server的req文件做签名，得到server的证书： 

```bash
openssl x509 -req -days 3650 -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt
```

 （注：如果第一次使用openssl，报告一些相关的文件找不到之类的错误，可能需要先执行2个命令：touch /etc/pki/CA/index.txt 和 echo '01' > /etc/pki/CA/serial）



server端使用java， 使用p12（PKCS12）格式的证书。使用openssl可以进行格式转换： 

```bash
openssl pkcs12 -export -clcerts -in server.crt -inkey server.key -out server.p12
```

java写过客户端， java使用CA文件格式为 jks。那么可能需要一个转换，这里使用的是java的bin目录下的keytool： 

```bash
keytool -importcert -alias CA -file ca.crt -keystore ca.jks
```

```java
				String file = "/file/path/server.p12";
        String keyType = "PKCS12"; char[] password = "passwd".toCharArray();
        KeyStore ks = KeyStore.getInstance(keyType);
        ks.load(new FileInputStream(file), password);
        KeyManagerFactory kmf = KeyManagerFactory.getInstance(
            KeyManagerFactory.getDefaultAlgorithm());
        kmf.init(ks, password);
        SSLContext ctx = SSLContext.getInstance("TLS");
        ctx.init(kmf.getKeyManagers(), null, null);

        SslFilter sslFilter = new SslFilter(ctx); // 在mina的acceptor中增加这个filter就可以了。 
acceptor.getFilterChain().addLast("ssl", new SslFilter(createSslContext()));

```

Nginx ssl 配置

```
	server {
        	listen       443;
        	server_name  www.fzk.com;
		ssl          on;
		#ssl_protocols 	TLSv1 TLSv1.1 TLSv1.2;
		#ssl_ciphers 	ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
		ssl_certificate     ../ssl/server.crt;
		ssl_certificate_key   ../ssl/server.key;

	        location / {
			proxy_pass	http://www.fzk.com;
			include	proxy.conf;
	   	}

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
```

