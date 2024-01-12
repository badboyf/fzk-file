
官方网站
https://nacos.io/zh-cn/docs/v2/quickstart/quick-start-docker.html
https://nacos.io/zh-cn/docs/quick-start.html
https://github.com/alibaba/spring-cloud-alibaba/wiki/%E7%89%88%E6%9C%AC%E8%AF%B4%E6%98%8E   版本说明

使用clashx导致 /nacos/v1/cs/configs/listener 502
```
c.a.n.c.config.http.ServerHttpAgent : [NACOS Exception httpPost] currentServerAddr: http://xxx:8848
```

在clashx配置文件目录新建proxyIgnoreList.plist
```shell
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<array>
    <string>192.168.0.0/16</string>
    <string>10.0.0.0/8</string>
    <string>172.16.0.0/12</string>
    <string>127.0.0.1</string>
    <string>localhost</string>
    <string>*.local</string>
    <string>*.crashlytics.com</string>
    <string>http://custom.org</string>
    <string>fzk-nacos.csdn.net:28848</string>
    <string>fzk-nacos.csdn.net</string>
</array>
</plist>
```

k8s创建
```yaml
apiVersion: v1
kind: Service
metadata:
  name: nacos-headless
  labels:
    app: nacos-headless
spec:
  type: ClusterIP
  clusterIP: None
  ports:
    - port: 8848
      name: server
      targetPort: 8848
    - port: 9848
      name: client-rpc
      targetPort: 9848
    - port: 9849
      name: raft-rpc
      targetPort: 9849
  selector:
    app: nacos
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: nacos
spec:
  serviceName: nacos-headless
  replicas: 1
  template:
    metadata:
      labels:
        app: nacos
      annotations:
        pod.alpha.kubernetes.io/initialized: "true"
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: "app"
                    operator: In
                    values:
                      - nacos
              topologyKey: "kubernetes.io/hostname"
      containers:
        - name: nacos
          imagePullPolicy: Always
          image: nacos/nacos-server
          resources:
            requests:
              memory: "2Gi"
              cpu: "500m"
          ports:
            - containerPort: 8848
              name: client
            - containerPort: 9848
              name: client-rpc
            - containerPort: 9849
          env:
            - name: MODE
              value: standalone
            - name: MYSQL_SERVICE_DB_NAME
              value: nacos
            - name: MYSQL_SERVICE_HOST
              value: "192.168.50.157"
            - name: MYSQL_SERVICE_PORT
              value: "3306"
            - name: MYSQL_SERVICE_PASSWORD
              value: "9BgFcw6RTg"
            - name: MYSQL_SERVICE_USER
              value: "root"
            - name: NACOS_APPLICATION_PORT
              value: "8848"
            - name: NACOS_REPLICAS
              value: "1"
            - name: NACOS_SERVERS
              value: "nacos-0.nacos-headless.default.svc.cluster.local:8848"
            - name: PREFER_HOST_MODE
              value: hostname
            - name: SPRING_DATASOURCE_PLATFORM
              value: mysql
  selector:
    matchLabels:
      app: nacos
---
apiVersion: v1
kind: Service
metadata:
  name: nacos-svc
  labels:
    app: nacos-svc
spec:
  type: ClusterIP
  ports:
    - port: 8848
      name: "8848"
      targetPort: 8848
    - name: client-rpc
      port: 9848
      protocol: TCP
      targetPort: 9848
    - name: raft-rpc
      port: 9849
      protocol: TCP
      targetPort: 9849
  selector:
    app: nacos
```