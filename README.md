<div align="center">
  <img src="https://img1.imgtp.com/2022/10/08/NqAiyAXQ.svg" style="width: 320px" alt="logo" />
  <h1>bf</h1>
</div>

> **bf**(Baidu Fanyi) is a translation tool, based on baidu translate api, that used in command line

<br >
<br >

<div align="center">
  <img src="https://img1.imgtp.com/2022/10/08/0NG97iSn.png" alt="logo" />
</div>

<br >
<br >

# Install

```shell
npm install bf-translate -g
```

# Usage

```shell
bf --help // or bf -h

// output

Usage bf [options] <query>

-v,--version        output the version number
-h,--help           show help info
-lang,--language    output the list of supported languages
--from <lang>       the source language
--to <lang>         the target language

```

bf is friendly to chinese-english translation. If your queries include Chinese, and without target language(--to), bf will regart queries as Chinese and translates it to English. Otherwise use `--from(default is auto)` and `--to(default is auto)` sets

```shell
bf hello, 吃饭了吗？

- Hello, have you eaten yet?
```
