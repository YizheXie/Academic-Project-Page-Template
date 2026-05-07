# Academic Project Page Template

This project is a static academic project page template. The page content is driven by JSON, Markdown, media files, and a BibTeX file, so adapting it to a new paper mainly means updating content rather than rewriting the page shell.

## Examples



## Local Preview

Run a local static server in the project root:

```bash
python -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

## Files You Usually Edit

- `content/site.json`: paper title, authors, hero buttons, teaser figure, section order, video options, footer note, and SEO settings
- `content/sections/*.md`: section text
- `content/media/*`: teaser image, figures, optional poster files, and optional local video files
- `content/paper.bib`: BibTeX entry
- `paper.pdf`: replace this file if you want the `Paper` button to point to a local PDF

## Template Defaults

This template ships with sample content, one generic placeholder figure, and `noindex` enabled by default. When you are getting ready to publish a real paper page, you can update `content/site.json` and set:

```json
{
  "seo": {
    "indexable": true
  }
}
```

You should also fill `seo.siteUrl` after the final production URL is known.

## Edit The Paper Header

Open `content/site.json`.

Use `title` for the browser title and default page title.

Use `hero.titleLines` if you want a controlled two-line title:

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

Each author entry supports:

- `name`
- `affiliation`
- `marker`
- `url` (optional)

Example:

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

The visible affiliation block under the authors is controlled by `hero.affiliationLine`.

## Hero Buttons

The hero buttons are defined in `links`.

Supported `type` values:

- `paper`
- `arxiv`
- `code`
- `data`
- `demo`
- `video`

Example:

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

`BibTeX` is added automatically and does not need to appear in `links`.

## Teaser Figure

The teaser is controlled by `hero.teaser`.

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

If you prefer not to show a teaser, you can remove `src` or set it to an empty string.

## Sections

The template follows the order written in `content/site.json`. There is no hard-coded paper-specific order anymore.

Each section supports:

- `id`: unique anchor id
- `title`: visible section title
- `markdown`: section text file
- `layout`: use `"text"` for the default title -> media -> text layout
- `mediaDisplay`: use `"stack"` for static figures or `"slider"` for a horizontal image switcher
- `media`: figure list
- `video`: optional video block
- `enabled`: whether the section is shown
- `showIndex`: whether the numeric section index is shown
- `hideFromNav`: whether the section appears in the top navigation
- `titleAlign`: use `"center"` if you want a centered section title
- `copyAlign`: use `"center"` if you want centered copy

Example:

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

## Optional Video Section

You can add a video block to any section with the `video` field.

For an embedded video:

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
    "caption": "A short note can explain where the video is hosted."
  },
  "enabled": true
}
```

For a local MP4 file:

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

If you would rather not show a video, you can remove the `video` field or set `enabled` to `false`.

If you omit `poster`, the browser will usually show the first frame once enough video data is loaded. Before that, the video area will stay on the dark background defined by the template.

By default, the template ships with one placeholder figure file, `content/media/template-figure.svg`. The teaser, overview, method, and results sections all reuse that same file. You can swap it for your own image, or point each section to different files in `content/site.json` whenever you like.

## BibTeX

The BibTeX block reads from `content/paper.bib`. You can update the sample entry with your own citation when the page is ready.

## Publishing Checklist

- Update the sample title, authors, and affiliations
- Update the teaser and section figures
- Update the Markdown section text
- Update `content/paper.bib`
- Update `paper.pdf` if you use a local PDF link
- Set `seo.indexable` to `true`
- Fill `seo.siteUrl` after the production URL is known
