```bash
git branch --set-upstream-to=origin/<branch> beta
git rebase -i HEAD~4 对最近的 4 个 commit 进行 rebase
git reset --hard origin/master      强制拉取远程分支覆盖本地代码
git checkout -b beta origin/beta

# 删除远程分支
git push origin --delete [branch_name]
```

查找被覆盖的分支代码

```shell
# 找到您要回滚到的提交编号
git reflog
git reset --hard yourCommitNum
```
本地Git仓库关联多个远程仓库的两种方法
```bash

# 修改origin地址
git remote set-url origin https://xxxx

# https://blog.csdn.net/s_156/article/details/120975674
$ git remote -v
origin  git@github.com:keithnull/keithnull.github.io.git (fetch)
origin  git@github.com:keithnull/keithnull.github.io.git (push)

$ git remote add coding.net git@git.coding.net:KeithNull/keithnull.github.io.git

$ git push origin master
$ git push coding.net master

$ git pull origin master
$ git pull coding.net master

```
