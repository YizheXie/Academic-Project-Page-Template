# Academic Project Page 模板说明

这个项目是一个静态学术论文主页模板。页面内容由 JSON、Markdown、媒体文件和 BibTeX 文件驱动，所以换论文时，主要是更新内容，不需要重写页面骨架。

## 本地预览

在项目根目录运行：

```bash
python -m http.server 8000
```

然后打开 `http://127.0.0.1:8000`。

## 你通常需要修改的文件

- `content/site.json`：标题、作者、按钮、teaser、章节顺序、视频配置、页脚说明、SEO
- `content/sections/*.md`：各章节正文
- `content/media/*`：teaser 图、章节图、可选 poster 图、可选本地视频
- `content/paper.bib`：BibTeX
- `paper.pdf`：如果 `Paper` 按钮要指向站内 PDF，就替换这个文件

## 模板默认状态

这个模板默认带示例内容、自带一张通用占位图，并且默认开启 `noindex`。当你准备把它用于真实论文页面时，可以先修改 `content/site.json`，把：

```json
{
  "seo": {
    "indexable": true
  }
}
```

设为 `true`。正式上线后，也建议补上 `seo.siteUrl`。

## 修改论文页顶部信息

打开 `content/site.json`。

`title` 控制浏览器标题和默认页面标题。

如果你想让首屏标题固定成两行，可以用 `hero.titleLines`：

```json
{
  "title": "Your Full Paper Title",
  "hero": {
    "titleLines": [
      "First line of the title",
      "Second line of the title"
    ]
  }
}
```

每个作者对象支持这些字段：

- `name`
- `affiliation`
- `marker`
- `url`，可选

示例：

```json
{
  "authors": [
    {
      "name": "First Author",
      "affiliation": "University A",
      "marker": "*",
      "url": "https://your-homepage-url"
    },
    {
      "name": "Second Author",
      "affiliation": "University B",
      "marker": "\\u2020"
    }
  ]
}
```

作者下面的机构行由 `hero.affiliationLine` 控制。

## 顶部按钮

首页按钮由 `links` 控制。

支持的 `type`：

- `paper`
- `arxiv`
- `code`
- `data`
- `demo`
- `video`

示例：

```json
{
  "links": [
    {
      "label": "Paper",
      "href": "paper.pdf",
      "type": "paper"
    },
    {
      "label": "Code",
      "href": "https://github.com/yourname/your-project",
      "type": "code"
    }
  ]
}
```

`BibTeX` 按钮会自动生成，不需要写进 `links`。

## Teaser 图

teaser 图由 `hero.teaser` 控制：

```json
{
  "hero": {
    "teaser": {
      "src": "content/media/teaser.png",
      "alt": "Short figure description"
    }
  }
}
```

如果你暂时不想显示 teaser，把 `src` 删除或设为空字符串即可。

## 章节配置

模板现在完全按 `content/site.json` 里的顺序渲染章节，不再写死论文专用顺序。

每个章节支持这些字段：

- `id`：锚点 id
- `title`：章节标题
- `markdown`：正文 Markdown 文件
- `layout`：默认用 `"text"`，也就是 标题 -> 图或视频 -> 正文
- `mediaDisplay`：`"stack"` 表示静态图，`"slider"` 表示左右切换图
- `media`：图片列表
- `video`：可选视频块
- `enabled`：是否显示
- `showIndex`：是否显示章节编号
- `hideFromNav`：是否在顶部导航显示
- `titleAlign`：如果要标题居中，设为 `"center"`
- `copyAlign`：如果要正文居中，设为 `"center"`

示例：

```json
{
  "sections": [
    {
      "id": "abstract",
      "title": "Abstract",
      "markdown": "content/sections/abstract.md",
      "layout": "text",
      "media": [],
      "showIndex": false,
      "titleAlign": "center",
      "enabled": true
    },
    {
      "id": "results",
      "title": "Results",
      "markdown": "content/sections/results.md",
      "layout": "text",
      "mediaDisplay": "slider",
      "media": [
        {
          "kind": "figure",
          "src": "content/media/results-a.png",
          "alt": "First result figure"
        },
        {
          "kind": "figure",
          "src": "content/media/results-b.png",
          "alt": "Second result figure"
        }
      ],
      "enabled": true
    }
  ]
}
```

## 可选视频功能

你可以在任意章节里加入 `video` 字段。

如果是嵌入 YouTube 或 Vimeo：

```json
{
  "id": "video",
  "title": "Video",
  "markdown": "content/sections/video.md",
  "layout": "text",
  "video": {
    "src": "https://www.youtube.com/embed/YOUR_VIDEO_ID",
    "title": "Project video",
    "ratio": "16 / 9",
    "caption": "可以用一句短说明交代视频来源。"
  },
  "enabled": true
}
```

如果是本地 MP4：

```json
{
  "id": "video",
  "title": "Video",
  "markdown": "content/sections/video.md",
  "layout": "text",
  "video": {
    "src": "content/media/demo.mp4",
    "poster": "content/media/video-poster.png",
    "title": "Project video",
    "ratio": "16 / 9",
    "controls": true
  },
  "enabled": true
}
```

如果你暂时不需要视频，删掉 `video` 字段，或者把这一节的 `enabled` 设为 `false` 即可。

如果你不写 `poster`，浏览器通常会在视频数据加载到一定程度后显示第一帧；在这之前，这个区域会先保持模板里的深色背景。

模板默认只带一张占位图文件，也就是 `content/media/template-figure.svg`。teaser、overview、method、results 默认都会复用这一张图。你后面可以直接替换这一个文件，也可以在 `content/site.json` 里把不同章节分别改成不同图片路径。

## BibTeX

BibTeX 区块会读取 `content/paper.bib`。把里面的占位条目换成你自己的引用信息即可。

## 发布前检查

- 替换占位标题、作者和机构
- 替换 teaser 图和章节图
- 替换所有 Markdown 正文
- 替换 `content/paper.bib`
- 如果你用站内 PDF，替换 `paper.pdf`
- 把 `seo.indexable` 改成 `true`
- 正式域名确定后，补上 `seo.siteUrl`
