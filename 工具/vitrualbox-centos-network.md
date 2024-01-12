# 解决virtualbox centos7安装后无ip，无网络问题

## 桥接网络

### 先查找本机ip,gateway,netmask

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201127164154579.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pob3VfUlI=,size_16,color_FFFFFF,t_70)

正常下，如果ip和网关在统一网段，动态ip可以随便申请的话，配置网络时使用桥接网络就可以。网络选正在用的网络

![在这里插入图片描述](https://img-blog.csdnimg.cn/2020112716520344.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pob3VfUlI=,size_16,color_FFFFFF,t_70)

进入虚拟机后配置网络，打开。

```
ONBOOT=yes
#BOOTPROTO=static
#IPADDR=192.168.81.113
#NETMASK=255.255.152.0
#GATEWAY=192.168.80.1
#DNS1=192.168.6.49    # 查看 cat /etc/resolv.conf
```

重启网卡

```
systemctl restart network
```

如果一切顺利，这时已经分配了动态ip，并可以访问网络。如果上面重启网卡失败，那么可能的原因是虚拟机中网关和ip不在同一网段，在虚拟机ping下网关。ping不通，可以用下面的方式来实现

## NAT + Host Only的方式

nat可以实现访问外部网络，Host Only实现与宿主机互通，两个网卡

### 创建出NAT 和 Host Only 网络，HostOnly可以把dhcp关掉，配置静态ip

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201127171353359.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pob3VfUlI=,size_16,color_FFFFFF,t_70)

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201127171455538.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pob3VfUlI=,size_16,color_FFFFFF,t_70)

### 配置虚拟机网络(双网卡)

![image-20201127171650815](/Users/fengzhikui/Library/Application Support/typora-user-images/image-20201127171650815.png)

![image-20201127171700245](/Users/fengzhikui/Library/Application Support/typora-user-images/image-20201127171700245.png)

启动虚拟机以后，ip addr 可以看到有两个网卡，enp0s3和enp0s8，为enp0s8网络创建一个配置文件。注意改下NAME, UUID, ONBOOT

```
cp /etc/sysconfig/network-scripts/ifcfg-enp0s3 /etc/sysconfig/network-scripts/ifcfg-enp0s8

# ifcfg-enp0s3
TYPE=Ethernet
BOOTPROTO=dhcp
DEFROUTE=yes
PEERDNS=yes
PEERROUTES=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_PEERDNS=yes
IPV6_PEERROUTES=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=enp0s3
UUID=c4cc9e69-914b-42c1-8411-f6e44f4d0597
ONBOOT=yes

# ifcfg-enp0s8
TYPE=Ethernet
BOOTPROTO=static
IPADDR=192.168.56.3
NETMASK=255.255.255.0
GATEWAY=192.168.56.1
DNS1=192.168.6.49
DEFROUTE=yes
PEERDNS=yes
PEERROUTES=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_PEERDNS=yes
IPV6_PEERROUTES=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=enp0s8
UUID=c4cc9e69-914b-42c1-8411-f6e44f4d0598
ONBOOT=yes
```

