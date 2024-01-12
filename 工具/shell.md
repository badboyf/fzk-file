### mac

```shell
du -h -d 1 /Users/fengzhikui 2>/dev/null     #查看磁盘大小，深度1
```

```
find log/ -newermt '2023-01-05' ! -newermt '2023-01-06'
find /Volumes/192.168.124.5/ -mmin -1  -printf "%CY-%Cm-%Cd %CH:%CM:%CS"

# -path 过滤掉指定路径
find /Volumes/192.168.124.5/ -path '/Volumes/192.168.124.5//Android/data/com.tencent.mobileqq' \
-path '/Volumes/192.168.124.5//Android/data/com.tencent.mm' \
-newermt '2023-02-26 01:55:00' ! -newermt '2023-02-26 01:56:00'

```