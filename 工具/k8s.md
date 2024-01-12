Github 好文

```bash
https://github.com/guangzhengli/k8s-tutorials
```

字符串转整数
```bash
echo "" | base64 -d > ca.crt
复制certificate-authority-data冒号后的内容生成client.crt
# echo "<certificate-authority-data>" | base64 -d > ca.crt

复制client-certificate-data冒号后的内容生成client.crt
# echo "" | base64 -d > client.crt

复制client-key-data冒号后的内容生成client.key
# echo "" | base64 -d > client.key

再生成jenkins使用的PKCS12格式的cert.pfx文件，需要设置密码，注意密码后期jenkins需要

# openssl pkcs12 -export -out client.pfx -inkey client.key -in client.crt -certfile ca.crt
Enter Export Password:
Verifying - Enter Export Password:
```