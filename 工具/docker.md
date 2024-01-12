### daocloud加速

​    curl -sSL https://get.daocloud.io/daotools/set_mirror.sh | sh -s http://f1361db2.m.daocloud.io

下载：

```shell
链接: https://pan.baidu.com/s/17YG4YF7hqmI0w-_zWJPiRA  密码: r9as
yum install -y docker-ce-18.06.1.ce-3.el7.x86_64.rpm

```

k8s字符串证书转 .crt .key
https://blog.csdn.net/weixin_38367535/article/details/120736935?from_wecom=1
```
复制certificate-authority-data冒号后的内容生成client.crt
# echo "<certificate-authority-data>" | base64 -d > ca.crt

复制client-certificate-data冒号后的内容生成client.crt
# echo "<client-certificate-data>" | base64 -d > client.crt

复制client-key-data冒号后的内容生成client.key
# echo "<client-key-data>" | base64 -d > client.key

再生成jenkins使用的PKCS12格式的cert.pfx文件，需要设置密码，注意密码后期jenkins需要
# openssl pkcs12 -export -out cert.pfx -inkey client.key -in client.crt -certfile ca.crt
```

# 将.crt文件转 keyStore文件
keytool -importcert -alias myalias -file ca.crt -keystore ca_keystore.p12 -storetype PKCS12

官网centos安装
```shell
https://docs.docker.com/engine/install/centos/

yum install -y yum-utils
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
# 查看可以安装的版本
yum list docker-ce --showduplicates | sort -r
# 指定版本安装
yum install docker-ce-<VERSION_STRING> docker-ce-cli-<VERSION_STRING> containerd.io docker-compose-plugin
# 最新版本
yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 删除的方法
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine

# 清理目录： /var/lib/docker/

```

minikube安装
```shell
# 下载二进制包，添加可执行权限，移动到bin目录，
# 因为我是root登录的所以是/usr/bin，其他用户登录是/usr/local/bin
curl -Lo minikube http://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && chmod +x minikube && mv minikube /usr/local/bin/

# kubectl
# curl -Lo kubectl http://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && chmod +x kubectl&& mv kubectl /usr/local/bin/ && ln -sf /usr/local/bin/kubectl /usr/bin/kubectl
curl -Lo kubectl http://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
install kubectl /usr/local/bin/kubectl

# kubeadm
curl -Lo kubeadm http://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubeadm

# kubelet
curl -Lo kubelet http://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubelet


# 关闭firewalld
systemctl stop firewalld
systemctl disable firewalld 
# 安装iptables管理工具，并清空规则：
yum -y install iptables-services && systemctl start iptables && systemctl enable iptables && iptables -F && service iptables save

# 关闭selinux 下面命令先关闭selinux，然后从selinux的配置文件中设置它为永久关闭。
setenforce 0 && sed -i 's/^SELINUX=.*/SELINUX=disabled/' /etc/selinux/config

# 关闭swap
# 下面的命令是将/etc/fstab中swap的哪一行注释掉，就是给哪一行最前面加个#
swapoff -a && sed -i '/ swap / s/^(.*)$/#1/g' /etc/fstab

# 调整内核参数
vim /etc/sysctl.d/kubernetes.conf
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
net.ipv4.ip_forward=1
net.ipv4.tcp_tw_recycle=0
# 禁止使用 swap 空间，只有当系统 OOM 时才允许使用它
vm.swappiness=0
# 不检查物理内存是否够用
vm.overcommit_memory=1
# 开启 OOM
vm.panic_on_oom=0
fs.inotify.max_user_instances=8192
fs.inotify.max_user_watches=1048576
fs.file-max=52706963
fs.nr_open=52706963
net.ipv6.conf.all.disable_ipv6=1
net.netfilter.nf_conntrack_max=2310720

# 调用配置
sysctl -p /etc/sysctl.d/kubernetes.conf

# 安装 kubelet kubeadm kubectl
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=http://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
gpgkey=http://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
        http://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
exclude=kubelet kubeadm kubectl
EOF

# 安装 kubelet kubeadm kubectl
yum install -y kubelet kubeadm kubectl --disableexcludes=kubernetes

# 开启kubelet
systemctl enable --now kubelet

# --driver=none/docker 区别，docker:用到的镜像等信息下载到minikube容器中，none:用本地的docker

# minikube delete 失败
sudo rm -rf ~/.kube
sudo rm -rf ~/.minikube
sudo rm -rf /var/lib/minikube
sudo rm -rf /var/lib/kubelet
sudo rm -rf /var/lib/localkube
sudo rm -rf /data/minikube
sudo rm -rf /var/lib/kubeadm.yaml

# 启动需要指定 --kubernetes-version=v1.23.8，自己的测试结果不指定会启动失败，Booting up control plane 这步报错
# --image-repository=registry.cn-hangzhou.aliyuncs.com/google_containers
minikube start --driver=docker --kubernetes-version=v1.23.8 --image-mirror-country=cn --force


minikube stop
minikube delete

#设置参数
minikube config set vm-driver kvm2

kubectl apply -f nacos.yaml
kubectl delete -f nacos.yaml
kubectl exec nginx-pod -- ls
kubectl delete pod nginx-pod
kubectl logs -f {id}
kubectl get pod -o wide
kubectl get endpoints
```

docker 重启
```shell
systemctl daemon-reload
 
systemctl restart docker

# 配置文件位置
/etc/docker/daemon.json
~/.docker/config.json
```

命令

```
docker save -o <filename>.tar image
docker load -i <filename>.tar
```

运行中的 容器追加端口：   把运行中的容器生成新的镜像，再新建容器

```

1.提交一个运行中的容器为镜像
docker commit [containerid] [new_imagename]

2.运行新建的镜像并添加端口映射
docker run -d -p 8000:80  [imagename] /bin/sh
```



### 启动remote api

**/usr/lib/systemd/system/docker.service**

```shell
ExecStart=/usr/bin/dockerd
```

改为

```shell
ExecStart=/usr/bin/dockerd -H tcp://0.0.0.0:2375 -H unix://var/run/docker.sock
```

```
systemctl daemon-reload
service docker restart
```

**查看docker版本**

> http://127.0.0.1:2375/version

**查看主机上所有docker镜像**

> http://127.0.0.1:2375/images/json

**查看所有容器清单**

> http://127.0.0.1:2375/containers/json

**创建新容器**

  在请求头中需要写创建容器的参数

> http://192.168.1.2:2375/ containers/create

  具体示例

```
curl -X POST -H "Content-Type: application/json" -d '{
  "Hostname":"", "User":"", "Memory": 0, "MemorySwap": 0,
  "AttachStdin": false, "AttachStdout": true, "AttachStderr": true,
  "PortSpecs": null, "Tty": false, "OpenStdin": false,
  "StdinOnce": false, "Env": null, "Cmd": [ "date" ],
  "Image": "alpine", "Tag": "latest", "Volumes": { "/tmp":{} },
  "WorkingDir": "", "DisableNetwork": false, 
  "ExposedPorts": {"22/tcp": {} }
  }'  http:// 192.168.1.2:2375/ containers/create
```

在请求头中需要写创建容器的参数

> http://127.0.0.1:2375/containers/create

**监控容器**

> http://127.0.0.1:2375/containers/(id)/json

**进程列表**

> http://127.0.0.1:2375/containers/(id)/top 

**容器日志**

> http://127.0.0.1:2375/containers/(id)/logs

**导出容器**

> http://127.0.0.1:2375/containers/(id)/export

**启动容器**

> http://127.0.0.1:2375/containers/(id)/start 

**停止容器**

> http://127.0.0.1:2375/containers/(id)/stop

**重启容器**

> http://127.0.0.1:2375/containers/(id)/restart

**终止容器**

> http://127.0.0.1:2375/containers/(id)/kill

