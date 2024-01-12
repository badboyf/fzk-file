保持终端会话

```bash
vim .ssh/config


//增加以下内容即可
host *
ControlMaster auto
ControlPath ~/.ssh/master-%r@%h:%p
```

