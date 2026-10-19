# adenxie.com.cn

Aden Xie 的个人作品集，部署在 [adenxie.com.cn](https://adenxie.com.cn/)（英文版在 `/en/`）。纯静态网站：Vite 加原生 JS，页面在构建时渲染成 HTML，运行时脚本只负责深浅色切换、复制安装命令和读取实时数字。

## 本地运行

需要 Node.js 20 或更高版本。

```sh
npm install
npm run dev      # 开发服务器
npm run build    # 先运行 scripts/fetch-live.mjs 更新数据快照，再构建到 dist/
npm test
```

## 实时数据

打开页面时，浏览器读取同源路径 `/live/*.json`。线上由 `vercel.json` 转发到秋招信库、Everyday Economics 和博客已经部署的静态文件，本地由 Vite 代理，所以作品集本身不需要定时重建。GitHub 提交由浏览器直接请求 GitHub API，结果在当前会话内缓存 15 分钟。

构建时 `scripts/fetch-live.mjs` 会把同样的数据保存到 `src/data/live.json`，写进静态 HTML。运行时读取失败就显示这份快照；构建时抓取失败则沿用上一次的快照，不会让构建失败（设置 `LIVE_FETCH=fail` 可以模拟抓取失败）。

## 新增作品

1. 在 `src/config/projects.js` 的 `projects` 里加一项：`category` 取 `websites`（截图和实时数字）、`skills`（示例图和安装命令）或 `harnessPlugins`（只有安装命令和包链接），也可以在 `categories` 里新增一类。
2. 在 `src/i18n/zh.json` 和 `src/i18n/en.json` 的 `projects.<id>` 下写名称、介绍和亮点。两个文件的 key 必须一致，`npm test` 会检查。
3. 网站作品运行 `npm run screenshots <id>` 生成截图；Agent Skill 的示例图放在 `public/media/` 下。

## 更新截图和图片

```sh
npm run screenshots          # 所有网站作品的桌面版和手机版截图 -> public/media/screens/*.webp
npm run screenshots jobs     # 只截一个
npm run media                # 头像、示例海报、分享图 og.png 和图标
```

这两个脚本需要手动运行，然后把结果提交到仓库；构建流程不会运行它们。脚本通过 playwright-core 调用本机的 Chrome 或 Edge，可以用 `CHROME_PATH` 指定浏览器。示例海报用 [photo-english-card](https://github.com/AdenXie/photo-english-card) 的 `scripts/render.mjs` 生成：内容文件是 `media-src/poster/photo.content.json`，原图 `photo.jpg` 不提交。

## 许可

代码以 [AGPL-3.0-only](LICENSE) 许可开源。个人介绍文字、头像、截图和示例海报不在许可范围内，详见 [NOTICE](NOTICE)。
