ffmpeg

./ffprobe -i t-h264-3.mp4 -v quiet -print_format json -show_format -show_streams   查看视频信息 https://www.cnblogs.com/viruscih/articles/11175740.html
./ffmpeg -i x.mp4 -vcodec h264 -b:v 2000k -bufsize 2000k th264.mp4 
./ffmpeg -i first.data -vcodec h264 -preset fast -b:v 2000k hello.h264
./ffmpeg -i x.mp4 -ss 0 -to 1747 -vcodec h264 -b:v 40327 -preset fast transcode/x.mp4   指定开始结束时间 -ss  -to

```shell
ffmpeg -i input max_muxing_queue_size 9999 -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -preset slow -movflags faststart -crf:18 -y output

-y : 覆盖输出文件，就是如果output.mp4文件已经存在，则不提示，直接覆盖，-n是不覆盖
-preset ultrafast、superfast、veryfast、faster、fast、medium、slow、slower、veryslow和placebo
```



### 报错-Too many packets buffered for output stream

```
增加 -max_muxing_queue_size 1024
ffmpeg -i xxx.mp4 -max_muxing_queue_size 1024 -vcodec h264 -preset fast -b:v 10k out.mp4
```

