```
1.创建服务器证书密钥文件 server.key：
openssl genrsa -des3 -out server.key 1024

2.创建服务器证书的申请文件 server.csr
openssl req -new -key server.key -out server.csr

4.备份一份服务器密钥文件
cp server.key server.key.org

5.去除文件口令
openssl rsa -in server.key.org -out server.key

6.生成证书文件server.crt
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt


openssl x509 -res -days 3650 -in reqFile -CA caCrtFile -CAkey caPrivateKeyFile -CAserial caSerialFile -extfile extFile -out outCrtFile


openssl req -new -x509 -keyout ca.key -out ca.crt
openssl genrsa -des3 -out server.key 1024
openssl req -new -key server.key -out server.csr
openssl ca -in server.csr -out server.crt -cert ca.crt -keyfile ca.key

openssl genrsa -out ca.key 2048
```

