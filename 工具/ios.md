### 安装cocoa，需安装ruby

###### 相关博客 http://blog.csdn.net/zhaoen95/article/details/51995520

(总共分两步, 1升级ruby .   2安装cocoa pods)

安装Homebrew

https://www.cnblogs.com/my-blogs-for-everone/articles/14256182.html

https://www.jianshu.com/p/c2e829027b0a

一. 升级ruby  (ps:ruby -v 查看当前版本，不用更新请忽略步骤一)

1、安装 RVM :RVM:Ruby Version Manager,Ruby版本管理器，包括Ruby的版本管理和Gem库管理(gemset)

- 安装RVM

**curl -L** [get.rvm.io](http://get.rvm.io/) **| bash -s stable**  如果不好用，使用喜爱按的安装Rvm指令：\curl -sSL [https://get.rvm.io](https://links.jianshu.com/go?to=https%3A%2F%2Fget.rvm.io) | bash -s stable

- 等待一段时间后就可以成功安装好 RVM。(等着就好了,不到10秒吧.)

**source ~/.bashrc****source ~/.bash_profile** 使用 RVM使用前先加载  source ~/.rvm/scripts/rvm1.查看所有的Ruby版本rvm list2.查看当前Ruby版本rvm currentrvm list knownrvm install 2.2.0rvm use 2.2.0rvm use 2.2.0 --default rvm list 3.指定不同的版本rvm --default use 2.7.0rvm --ruby-version use 2.7.0Command + Shift + F  查找.ruby-version 的文件，打开它，设置你想要使用的ruby版本 

测试是否安装正常,(以上两个命令行敲了不会显示什么,但是需要敲)

 

- 显示版本,会出现下边的样子(当然版本会由于时间的关系显示的不一样,下边的除了版本数不一定一样,其他的都是套路)

**rvm -v** 

2、用RVM升级Ruby

- 主要是第五行,看一下当前的版本有哪些?然后第七行安装个版本高点的

#查看当前ruby版本  **ruby -v**  #列出已知的ruby版本  **rvm list known** #安装ruby 1.9.3  **rvm install 2.3**  （你看到的时候也许就是2.4版本了）

安装完成会显示这个:Install of ruby-2.3.0 - #complete Ruby was built without documentation, to build it run: rvm docs generate-ri

- 安装完成之后ruby -v查看是否安装成功。 **好了,ruby安装完了.**

3、最好升级Gem

- 查看版本

**gem -v**

- 升级gem

**sudo gem update —system**

二.安装cocoapods

- 切换cocoapods的数据源【先删除，再添加，查看】

```
gem source --remove https://rubygems.org/
gem source -a https://gems.ruby-china.com/
    2008/11/29 修改: 淘宝镜像**gem source -a* https://ruby.taobao.org/ *已经不再维护*  
gem source -l
```



- 安装cocoa pods (以下两种命令都可以)

```
sudo gem install cocoapods
sudo gem install -n /usr/local/bin cocoa pods（如10.11系统）
```

- 设置pod仓库

**pod setup**

(ps:上边这一步需要等很久了!!!!大约不到550M吧 看你网速了,一般3个小时左右吧,你可以看一下,这个仓库会在你个人文件夹下创建一个隐藏文件.cocoapods 所有的文件都下载这里边,用os系统你可以用空格的方法,或者右键点击查看文件夹的大小的方法来查看下载了多少,这样心里就有个数了... ...少年你可以出门去小卖部买干脆面了...)

三.更新cocoapods （ps:更新ruby导致错误，或者主动要更新cocoapods新版本）

- 查看 Ruby 版本：

  ```shell
  ruby -v
  ```

- 更新 gem ，国内需切换 gem source

```shell
sudo gem update —-system
```

- 国内需切换 

  ```shell
  gem source
  ```

**gem source --remove** https://rubygems.org/**gem source -a** https://ruby.taobao.org/**gem source -l**

- 安装cocoa pods (一下两种命令都可以)

**sudo gem install cocoapods****sudo gem install -n /usr/local/bin cocoa pods**  **（**如10.11系统）

和安装过程是一样的，

- 再次查看 pod 版本：pod --version

**卸载** 

**sudo gem uninstall cocoapods**

\---------------------------------------------------------------------------------------------------------------

显示隐藏文件的命令:

5.测试

defaults write com.apple.finder AppleShowAllFiles Yes && killall Finder

不显示隐藏文件的命令:

defaults write com.apple.finder AppleShowAllFiles No && killall Finder

\>

CocoaPods 1.1.0.beta.1 is available.

To update use: `sudo gem install cocoapods --pre`

[!] This is a test version we'd love you to try.

For more information, see [https://blog.cocoapods.org](https://blog.cocoapods.org/) and the CHANGELOG for this version at https://github.com/CocoaPods/CocoaPods/releases/tag/1.1.0.beta.1

Setup completed

(上边是下载完的样子) 【如果有版本号，则说明已经安装成功】

  pod --version

6.利用cocoapods来安装第三方框架

  01 进入要安装框架的项目的.xcodeproj同级文件夹

  02 在该文件夹中新建一个文件podfile (pod init)

  03 在文件中告诉cocoapods需要安装的框架信息

​    a.该框架支持的平台

​    b.适用的iOS版本

​    c.框架的名称

​    d.框架的版本

7.安装

  pod install

  pod update --no-repo-update

8.说明

  platform :ios, '7.0' 用来设置所有第三方库所支持的iOS最低版本

  pod 'SDWebImage','~>3.7.5' 设置框架的名称和版本号

  版本号的规则：

  '>1.0'  可以安装任何高于1.0的版本

  '>=1.0'  可以安装任何高于或等于1.0的版本

  '<1.0'  任何低于1.0的版本

  '<=1.0'  任何低于或等于1.0的版本

  '~>0.1'  任何高于或等于0.1的版本，但是不包含高于1.0的版本

  '~>0'   任何版本，相当于不指定版本，默认采用最新版本号

9.使用pod install命令安装框架后的大致过程：

  01 分析依赖:该步骤会分析Podfile,查看不同类库之间的依赖情况。如果有多个类库依赖于同一个类库，但是依赖于不同的版本，那么cocoaPods会自动设置一个兼容的版本。

  02 下载依赖:根据分析依赖的结果，下载指定版本的类库到本地项目中。

  03 生成Pods项目：创建一个Pods项目专门用来编译和管理第三方框架，CocoaPods会将所需的框架，库等内容添加到项目中，并且进行相应的配置。

  04 整合Pods项目：将Pods和项目整合到一个工作空间中，并且设置文件链接。

卸载：sudo gem uninstall cocoapods

常见错误：

[!] /usr/bin/git pull --ff-only

原因： Cocoapods的分支不支持当前最新的Xcode版本

解决办法: 删除master分支 重新建立新的分支，然后重新设置仓库即可

sudo rm -fr ~/.cocoapods/repos/master

pod setup

