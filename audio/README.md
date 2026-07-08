# 音频文件夹

把 mp3 / wav / flac 文件放进这个文件夹，
然后在仓库根目录的 `tracks.js` 里加一行：

```js
{ type: 'local', src: 'audio/文件名.mp3', title: '歌名', year: '2025', note: '原创' },
```

网站试听区就会出现这首歌，带波形动画。

> 注意：GitHub 单文件上限 100MB，普通 mp3（320kbps，5分钟约12MB）完全没问题。
