if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      void initPage()
    },
    { once: true }
  )
} else {
  void initPage()
}

async function initPage() {
  const status = document.getElementById("status-banner")
  const app = document.getElementById("app")
  const nav = document.getElementById("site-nav")

  if (window.location.protocol === "file:") {
    showError(
      status,
      "Open this template with a local static server so the browser can load JSON, Markdown, and BibTeX files."
    )
    return
  }

  try {
    const config = await fetchJson("content/site.json")
    const sections = await loadSections(config.sections || [])
    const bibtex = await fetchText(config.bibtexPath)
    const abstractText = getSectionPlainText(sections, "abstract")

    applyHeadMetadata(config, abstractText)
    syncSiteMark(config)

    nav.innerHTML = renderNav(sections)
    app.innerHTML = [
      renderHero(config),
      renderTeaser(config.hero?.teaser),
      renderSections(sections),
      renderBibtex(bibtex, sections.length + 1),
      renderFooter(config.footer || config.contact)
    ].join("")

    bindCopyButton(bibtex)
    registerMediaSliders()
    registerRevealAnimations()
    registerNavTracking()
    status.hidden = true
    document.body.classList.remove("is-loading")
    document.body.classList.add("is-ready")
  } catch (error) {
    showError(status, error instanceof Error ? error.message : "Could not load the project page.")
  }
}

async function loadSections(sections) {
  const loaded = await Promise.all(
    sections.map(async (section) => {
      if (!section.enabled) {
        return null
      }

      const markdown = section.markdown ? await fetchText(section.markdown) : ""
      return {
        ...section,
        html: markdown ? renderMarkdown(markdown) : ""
      }
    })
  )

  return loaded.filter(Boolean).filter((section) => section.html || (section.media || []).length)
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" })

  if (!response.ok) {
    throw new Error(`Could not load ${path}.`)
  }

  return response.json()
}

async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" })

  if (!response.ok) {
    throw new Error(`Could not load ${path}.`)
  }

  return response.text()
}

function renderNav(sections) {
  const items = [
    ...sections
      .filter((section) => !section.hideFromNav)
      .map((section) => ({ id: section.id, title: section.title })),
    { id: "bibtex", title: "BibTeX" }
  ]

  return items
    .map(
      (item) =>
        `<a class="site-nav__link" data-target="${escapeAttribute(item.id)}" href="#${escapeAttribute(
          item.id
        )}">${escapeHtml(item.title)}</a>`
    )
    .join("")
}

function syncSiteMark(config) {
  const siteMark = document.querySelector(".site-mark")

  if (!siteMark) {
    return
  }

  siteMark.textContent = (config.siteMark || "Academic Project Page").trim()
}

function renderHero(config) {
  const actions = [
    ...(config.links || []).map(renderHeroActionLink),
    `<a class="button button--hero" href="#bibtex">${renderHeroButtonInner("bibtex", "BibTeX")}</a>`
  ].join("")

  const affiliations = uniqueNonPlaceholderAffiliations(config.authors || [])

  return `
    <section class="hero reveal is-visible" id="home" data-section="home">
      <div class="container">
        <div class="hero__grid">
          <div>
            ${config.hero?.eyebrow ? `<p class="hero__eyebrow">${escapeHtml(config.hero.eyebrow)}</p>` : ""}
            <h1 class="hero__title">${renderHeroTitle(config)}</h1>
            ${config.subtitle ? `<p class="hero__subtitle">${escapeHtml(config.subtitle)}</p>` : ""}
            <p class="hero__authors">${renderAuthorsInline(config.authors || [])}</p>
            ${
              config.hero?.affiliationLine
                ? `<p class="hero__affiliations">${renderAffiliationLine(config.hero.affiliationLine)}</p>`
                : affiliations.length
                  ? `<p class="hero__affiliations">${escapeHtml(affiliations.join("  /  "))}</p>`
                  : ""
            }
            ${
              config.hero?.authorNote
                ? `<p class="hero__author-note">${escapeHtml(config.hero.authorNote)}</p>`
                : ""
            }
            ${renderHeroMeta(config)}
            ${
              config.hero?.highlight
                ? ""
                : ""
            }
            <div class="hero__actions">${actions}</div>
            ${
              config.hero?.highlight
                ? `<p class="hero__summary">${escapeHtml(config.hero.highlight)}</p>`
                : ""
            }
          </div>
        </div>
      </div>
    </section>
  `
}

function renderHeroTitle(config) {
  const lines = Array.isArray(config.hero?.titleLines) && config.hero.titleLines.length
    ? config.hero.titleLines
    : [config.title]

  return lines
    .map((line) => `<span class="hero__title-line">${escapeHtml(line)}</span>`)
    .join("")
}

function renderAuthorsInline(authors) {
  return authors
    .map((author) => `<span class="hero__author-entry">${renderAuthorToken(author)}</span>`)
    .join("")
}

function renderAuthorToken(author) {
  const label = escapeHtml(author.name)
  const marker = author.marker ? `<sup class="hero__author-marker">${escapeHtml(author.marker)}</sup>` : ""

  if (author.url) {
    return `<a class="hero__author hero__author--link" href="${escapeAttribute(author.url)}" target="_blank" rel="noreferrer">${label}${marker}</a>`
  }

  return `<span class="hero__author">${label}${marker}</span>`
}

function renderHeroActionLink(link) {
  const href = (link.href || "").trim()

  if (!href) {
    return ""
  }

  const isAnchor = href.startsWith("#")
  const rel = isAnchor ? "" : ' target="_blank" rel="noreferrer"'

  return `<a class="button button--hero" href="${escapeAttribute(href)}"${rel}>${renderHeroButtonInner(
    link.type,
    link.label
  )}</a>`
}

function renderAffiliationLine(items) {
  return items
    .map(
      (item) =>
        `<span class="hero__affiliation-item"><sup class="hero__author-marker">${escapeHtml(
          item.marker || ""
        )}</sup>${escapeHtml(item.text || "")}</span>`
    )
    .join("")
}

function renderHeroMeta(config) {
  if (!config.venue && !config.year) {
    return ""
  }

  if (config.venue && config.year) {
    return `<p class="hero__meta">${escapeHtml(config.venue)}<span aria-hidden="true">/</span>${escapeHtml(
      String(config.year)
    )}</p>`
  }

  return `<p class="hero__meta">${escapeHtml(String(config.venue || config.year || ""))}</p>`
}

function renderHeroButtonInner(type, label) {
  return `
    <span class="button__icon" aria-hidden="true">${renderButtonIcon(type)}</span>
    <span class="button__label">${escapeHtml(label)}</span>
  `
}

function renderButtonIcon(type) {
  if (type === "paper") {
    return `
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M14 3.5V8h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M9 12h6M9 15.5h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `
  }

  if (type === "arxiv") {
    return `
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M6 18.5 12 5.5l6 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.5 13.5h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `
  }

  if (type === "data" || type === "code") {
    return `
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5 10.5 19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
  }

  if (type === "demo" || type === "video") {
    return `
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M7.5 5.5h9A1.5 1.5 0 0 1 18 7v10a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 17V7a1.5 1.5 0 0 1 1.5-1.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="m10 9 5 3-5 3Z" fill="currentColor"/>
      </svg>
    `
  }

  if (type === "bibtex") {
    return `
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M8 6.5h8M8 12h8M8 17.5h5M5.5 4.5h13A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V6a1.5 1.5 0 0 1 1.5-1.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
  }

  return `
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M9 12h6M9 15.5h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `
}

function renderTeaser(teaser) {
  if (!teaser?.src) {
    return ""
  }

  return `
    <section class="page-section reveal">
      <div class="container">
        <div class="teaser-media">
          <img src="${escapeAttribute(teaser.src)}" alt="${escapeAttribute(teaser.alt || "")}">
        </div>
      </div>
    </section>
  `
}

function renderSections(sections) {
  let numberedIndex = 1

  return sections
    .map((section) => {
      const shouldShowIndex = section.showIndex !== false
      const displayIndex = shouldShowIndex ? numberedIndex++ : null
      return renderSection(section, displayIndex)
    })
    .join("")
}

function renderSection(section, displayIndex) {
  const media = section.media || []
  const layout = ["text", "split", "gallery"].includes(section.layout) ? section.layout : "text"
  const copyClass = layout === "gallery" ? "section-copy section-copy--wide prose" : "section-copy prose"
  const videoMarkup = renderSectionVideo(section.video)
  const mediaMarkup = renderSectionMedia(section, layout, media)
  const hasVisual = Boolean(videoMarkup) || media.length > 0
  const emptyMediaClass = hasVisual ? "" : " section--media-empty"
  const numberClass = displayIndex === null ? "" : " page-section--numbered"
  const titleAlignClass = section.titleAlign === "center" ? " page-section--title-center" : ""
  const copyAlignClass = section.copyAlign === "center" ? " page-section--copy-center" : ""
  const copyMarkup = `
          <div class="${copyClass}">
            ${section.html}
          </div>
  `
  const assetMarkup = [videoMarkup, mediaMarkup].filter(Boolean).join("")
  const bodyMarkup = assetMarkup ? `${assetMarkup}${copyMarkup}` : copyMarkup
  const headerMarkup = `
          <header class="section-header">
            ${
              displayIndex === null
                ? ""
                : `<p class="section-index">${escapeHtml(String(displayIndex).padStart(2, "0"))}</p>`
            }
            <h2 class="section-title">${escapeHtml(section.title)}</h2>
          </header>
  `

  return `
    <section
      class="page-section page-section--${escapeAttribute(layout)}${emptyMediaClass}${numberClass}${titleAlignClass}${copyAlignClass} reveal"
      id="${escapeAttribute(section.id)}"
      data-section="${escapeAttribute(section.id)}"
    >
      <div class="container">
        <div class="section-shell">
          ${headerMarkup}
          ${bodyMarkup}
        </div>
      </div>
    </section>
  `
}

function renderSectionVideo(video) {
  if (!video?.src) {
    return ""
  }

  const ratio = (video.ratio || "16 / 9").trim()
  const title = (video.title || "Project video").trim()
  const caption = video.caption ? `<p class="video-caption">${escapeHtml(video.caption)}</p>` : ""
  const body = isEmbeddedVideoSource(video.src)
    ? renderEmbeddedVideo(video.src, title)
    : renderHostedVideo(video)

  return `
    <div class="section-video-wrap" style="--section-video-ratio: ${escapeAttribute(ratio)}">
      <div class="video-embed">
        ${body}
      </div>
      ${caption}
    </div>
  `
}

function isEmbeddedVideoSource(src) {
  return /^https?:\/\//i.test(src) && !/\.(mp4|webm|ogg)(?:[?#]|$)/i.test(src)
}

function renderEmbeddedVideo(src, title) {
  return `
    <iframe
      src="${escapeAttribute(src)}"
      title="${escapeAttribute(title)}"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
    ></iframe>
  `
}

function renderHostedVideo(video) {
  const autoplay = video.autoplay ? " autoplay" : ""
  const muted = video.muted ? " muted" : ""
  const loop = video.loop ? " loop" : ""
  const playsInline = video.playsInline === false ? "" : " playsinline"
  const controls = video.controls === false ? "" : " controls"
  const poster = video.poster ? ` poster="${escapeAttribute(video.poster)}"` : ""

  return `
    <video${controls}${autoplay}${muted}${loop}${playsInline}${poster}>
      <source src="${escapeAttribute(video.src)}">
    </video>
  `
}

function renderSectionMedia(section, layout, media) {
  if (!media.length) {
    return ""
  }

  const mediaWidth = section.mediaWidth ? ` style="--section-media-width: ${escapeAttribute(section.mediaWidth)}"` : ""

  if (section.mediaDisplay === "slider" && media.length > 1) {
    return `<div class="section-media-wrap"${mediaWidth}>${renderMediaSlider(media, section.title)}</div>`
  }

  const content = layout === "gallery" ? renderMediaGrid(media) : renderMediaColumn(media)
  return `<div class="section-media-wrap"${mediaWidth}>${content}</div>`
}

function renderMediaColumn(media) {
  if (!media.length) {
    return ""
  }

  return `<div class="media-column">${media.map(renderMediaItem).join("")}</div>`
}

function renderMediaGrid(media) {
  if (!media.length) {
    return ""
  }

  return `<div class="media-grid">${media.map(renderMediaItem).join("")}</div>`
}

function renderMediaSlider(media, sectionTitle) {
  const dots = media
    .map(
      (_, index) => `
        <button
          class="media-slider__dot${index === 0 ? " is-active" : ""}"
          type="button"
          data-slider-dot="${index}"
          aria-label="${escapeAttribute(sectionTitle)} image ${index + 1}"
        ></button>
      `
    )
    .join("")

  return `
    <div class="media-slider" data-media-slider>
      <button class="media-slider__button media-slider__button--prev" type="button" data-slider-prev aria-label="Previous image">
        ${renderSliderIcon("prev")}
      </button>
      <div class="media-slider__viewport" tabindex="0">
        <div class="media-slider__track" data-slider-track>
          ${media
            .map(
              (item, index) => `
                <div class="media-slider__slide${index === 0 ? " is-active" : ""}" data-slider-slide>
                  ${renderMediaItem(item)}
                </div>
              `
            )
            .join("")}
        </div>
      </div>
      <button class="media-slider__button media-slider__button--next" type="button" data-slider-next aria-label="Next image">
        ${renderSliderIcon("next")}
      </button>
      <div class="media-slider__dots" aria-label="${escapeAttribute(sectionTitle)} images">
        ${dots}
      </div>
    </div>
  `
}

function renderMediaItem(item) {
  if (item.kind === "stat") {
    return `
      <article class="media-item media-item--stat stat-card">
        <p class="stat-card__value">${escapeHtml(item.value || "")}</p>
        <p class="stat-card__label">${escapeHtml(item.label || "")}</p>
        ${item.note ? `<p class="stat-card__note">${escapeHtml(item.note)}</p>` : ""}
      </article>
    `
  }

  return `
    <figure class="media-item media-item--figure figure-plain">
      <img
        src="${escapeAttribute(item.src || "")}"
        alt="${escapeAttribute(item.alt || "")}"
        loading="lazy"
      >
    </figure>
  `
}

function renderSliderIcon(direction) {
  const path =
    direction === "prev"
      ? '<path d="m14.5 6.5-6 5.5 6 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<path d="m9.5 6.5 6 5.5-6 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'

  return `
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      ${path}
    </svg>
  `
}

function renderBibtex(bibtex, index) {
  const displayIndex = Math.max(index - 1, 1)

  return `
    <section class="page-section page-section--numbered page-section--bibtex reveal" id="bibtex" data-section="bibtex">
      <div class="container">
        <div class="section-shell">
          <header class="section-header">
            <p class="section-index">${String(displayIndex).padStart(2, "0")}</p>
            <h2 class="section-title">BibTeX</h2>
          </header>
          <div class="section-copy section-copy--wide">
          <div class="bibtex-card">
            <div class="bibtex-card__top">
              <p class="bibtex-card__title">Citation</p>
              <button class="button button--ghost" id="copy-bibtex" type="button">Copy</button>
            </div>
            <pre><code>${escapeHtml(bibtex.trim())}</code></pre>
            <div class="copy-status" id="copy-status" aria-live="polite"></div>
          </div>
          </div>
        </div>
      </div>
    </section>
  `
}

function renderFooter(contact) {
  if (!contact) {
    return ""
  }

  const mainLine =
    contact.href && contact.label
      ? `<p><a class="template-link" href="${escapeAttribute(contact.href)}">${escapeHtml(contact.label)}</a></p>`
      : contact.label
        ? `<p>${escapeHtml(contact.label)}</p>`
        : ""

  return `
    <footer class="page-section reveal">
      <div class="container">
        <div class="footer-card">
          ${mainLine}
          ${contact.note ? `<p class="footer-card__note">${escapeHtml(contact.note)}</p>` : ""}
        </div>
      </div>
    </footer>
  `
}

function bindCopyButton(bibtex) {
  const button = document.getElementById("copy-bibtex")
  const status = document.getElementById("copy-status")

  if (!button || !status) {
    return
  }

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(bibtex.trim())
      status.textContent = "BibTeX copied."
    } catch (error) {
      status.textContent = "Clipboard access failed."
    }
  })
}

function registerRevealAnimations() {
  const elements = document.querySelectorAll(".reveal:not(.is-visible)")

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px"
    }
  )

  elements.forEach((element) => revealObserver.observe(element))
}

function registerNavTracking() {
  const links = Array.from(document.querySelectorAll(".site-nav__link"))
  const linkTargets = new Set(links.map((link) => link.getAttribute("data-target")))
  const targets = Array.from(document.querySelectorAll("[data-section]")).filter((target) =>
    linkTargets.has(target.getAttribute("data-section"))
  )

  if (links.length) {
    links[0].classList.add("is-active")
  }

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

      if (!visible) {
        return
      }

      const id = visible.target.getAttribute("data-section")
      links.forEach((link) => {
        const isActive = link.getAttribute("data-target") === id
        link.classList.toggle("is-active", isActive)
      })
    },
    {
      threshold: [0.15, 0.35, 0.6],
      rootMargin: "-35% 0px -45% 0px"
    }
  )

  targets.forEach((target) => sectionObserver.observe(target))
}

function registerMediaSliders() {
  const sliders = Array.from(document.querySelectorAll("[data-media-slider]"))

  sliders.forEach((slider) => {
    const track = slider.querySelector("[data-slider-track]")
    const slides = Array.from(slider.querySelectorAll("[data-slider-slide]"))
    const prev = slider.querySelector("[data-slider-prev]")
    const next = slider.querySelector("[data-slider-next]")
    const dots = Array.from(slider.querySelectorAll("[data-slider-dot]"))
    const viewport = slider.querySelector(".media-slider__viewport")

    if (!track || slides.length < 2 || !prev || !next) {
      return
    }

    let currentIndex = 0
    let touchStartX = null

    const updateSlider = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`

      slides.forEach((slide, index) => {
        slide.classList.toggle("is-active", index === currentIndex)
      })

      dots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === currentIndex)
      })
    }

    const moveTo = (nextIndex) => {
      currentIndex = (nextIndex + slides.length) % slides.length
      updateSlider()
    }

    prev.addEventListener("click", () => moveTo(currentIndex - 1))
    next.addEventListener("click", () => moveTo(currentIndex + 1))

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => moveTo(index))
    })

    viewport?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        moveTo(currentIndex - 1)
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        moveTo(currentIndex + 1)
      }
    })

    viewport?.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0]?.clientX ?? null
      },
      { passive: true }
    )

    viewport?.addEventListener(
      "touchend",
      (event) => {
        const touchEndX = event.changedTouches[0]?.clientX ?? null

        if (touchStartX === null || touchEndX === null) {
          return
        }

        const deltaX = touchEndX - touchStartX

        if (Math.abs(deltaX) > 40) {
          moveTo(currentIndex + (deltaX < 0 ? 1 : -1))
        }

        touchStartX = null
      },
      { passive: true }
    )

    updateSlider()
  })
}

function renderMarkdown(markdown) {
  const { text, tokens } = extractMathTokens(markdown)
  const html = window.marked.parse(text)
  return restoreMathTokens(html, tokens)
}

function extractMathTokens(markdown) {
  const tokens = []
  let text = markdown

  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, expression) => {
    const index = tokens.push({ expression: expression.trim(), displayMode: true }) - 1
    return `MATH_TOKEN_${index}`
  })

  text = text.replace(/(?<!\\)\$([^\n$]+?)\$/g, (_, expression) => {
    const index = tokens.push({ expression: expression.trim(), displayMode: false }) - 1
    return `MATH_TOKEN_${index}`
  })

  return { text, tokens }
}

function restoreMathTokens(html, tokens) {
  if (!tokens.length) {
    return html
  }

  return html.replace(/MATH_TOKEN_(\d+)/g, (_, rawIndex) => {
    const token = tokens[Number(rawIndex)]

    if (!token) {
      return ""
    }

    return renderMath(token.expression, token.displayMode)
  })
}

function renderMath(expression, displayMode) {
  if (!window.katex?.renderToString) {
    const tag = displayMode ? "div" : "span"
    return `<${tag} class="math-fallback">${escapeHtml(expression)}</${tag}>`
  }

  return window.katex.renderToString(expression, {
    displayMode,
    throwOnError: false
  })
}

function applyHeadMetadata(config, abstractText) {
  const seo = config.seo || {}
  const title = (config.title || "").trim() || document.title
  const description = (seo.description || abstractText || config.subtitle || title).trim()
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.filter(Boolean) : []
  const ogType = seo.indexable === false ? "website" : "article"
  const robots = seo.indexable === false
    ? "noindex,nofollow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
    : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
  const pageUrl = getPageUrl(seo.siteUrl)
  const imageUrl = resolveAbsoluteUrl(seo.image || config.hero?.teaser?.src, seo.siteUrl)

  document.title = title
  setMetaDescription(description)
  setMetaTag("name", "keywords", keywords.join(", "))
  setMetaTag("property", "og:type", ogType)
  setMetaTag("property", "og:title", title)
  setMetaTag("property", "og:description", description)
  setMetaTag("name", "twitter:card", "summary_large_image")
  setMetaTag("name", "twitter:title", title)
  setMetaTag("name", "twitter:description", description)
  setMetaTag("name", "robots", robots)

  if (pageUrl) {
    setCanonicalUrl(pageUrl)
    setMetaTag("property", "og:url", pageUrl)
  }

  if (imageUrl) {
    setMetaTag("property", "og:image", imageUrl)
    setMetaTag("name", "twitter:image", imageUrl)
  }

  if (config.hero?.teaser?.alt) {
    setMetaTag("property", "og:image:alt", config.hero.teaser.alt)
  }

  replaceMultiMeta("property", "article:tag", keywords)
  syncCitationMeta(config, seo, pageUrl)
  syncStructuredData(config, seo, description, pageUrl, imageUrl, keywords)
}

function getPageUrl(siteUrl) {
  if (siteUrl) {
    return ensureTrailingSlash(siteUrl)
  }

  if (!/^https?:$/i.test(window.location.protocol)) {
    return ""
  }

  const url = new URL(window.location.href)
  url.hash = ""
  url.search = ""
  return url.toString()
}

function resolveAbsoluteUrl(path, siteUrl) {
  if (!path) {
    return ""
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  if (siteUrl) {
    return new URL(path, ensureTrailingSlash(siteUrl)).toString()
  }

  if (/^https?:$/i.test(window.location.protocol)) {
    return new URL(path, window.location.href).toString()
  }

  return path
}

function ensureTrailingSlash(url) {
  return url.endsWith("/") ? url : `${url}/`
}

function syncCitationMeta(config, seo, pageUrl) {
  setMetaTag("name", "citation_title", config.title || "")
  replaceMultiMeta(
    "name",
    "citation_author",
    (config.authors || []).map((author) => author.name).filter(Boolean)
  )

  if (seo.publishedDate) {
    const scholarDate = seo.publishedDate.replaceAll("-", "/")
    setMetaTag("name", "citation_publication_date", scholarDate)
    setMetaTag("name", "citation_online_date", scholarDate)
  }

  if (seo.citationVenue) {
    setMetaTag("name", "citation_journal_title", seo.citationVenue)
  }

  if (seo.doi) {
    setMetaTag("name", "citation_doi", seo.doi)
  }

  if (pageUrl) {
    setMetaTag("name", "citation_abstract_html_url", pageUrl)
  }

  const paperLink = (config.links || []).find((link) => link.type === "paper")?.href
  const pdfUrl = resolveAbsoluteUrl(paperLink, seo.siteUrl)

  if (pdfUrl) {
    setMetaTag("name", "citation_pdf_url", pdfUrl)
  }
}

function syncStructuredData(config, seo, description, pageUrl, imageUrl, keywords) {
  const tag = document.getElementById("structured-data")

  if (!tag) {
    return
  }

  const sameAs = [
    ...(config.links || []).map((link) => resolveAbsoluteUrl(link.href, seo.siteUrl)).filter(Boolean),
    seo.doi ? `https://doi.org/${seo.doi}` : ""
  ].filter(Boolean)

  const data = cleanStructuredData({
    "@context": "https://schema.org",
    "@type": seo.indexable === false ? "WebSite" : "ScholarlyArticle",
    headline: config.title,
    name: config.title,
    description,
    datePublished: seo.publishedDate || undefined,
    dateModified: seo.publishedDate || undefined,
    url: pageUrl || undefined,
    mainEntityOfPage: pageUrl || undefined,
    image: imageUrl || undefined,
    keywords: keywords.length ? keywords.join(", ") : undefined,
    identifier: seo.doi ? `https://doi.org/${seo.doi}` : undefined,
    sameAs,
    author: (config.authors || [])
      .map((author) =>
        cleanStructuredData({
          "@type": "Person",
          name: author.name || undefined,
          affiliation: author.affiliation
            ? {
                "@type": "Organization",
                name: author.affiliation
              }
            : undefined,
          url: author.url || undefined
        })
      )
      .filter((author) => Object.keys(author).length > 1)
  })

  tag.textContent = JSON.stringify(data)
}

function cleanStructuredData(value) {
  if (Array.isArray(value)) {
    return value.map(cleanStructuredData).filter((item) => {
      if (item == null) {
        return false
      }

      if (Array.isArray(item)) {
        return item.length > 0
      }

      if (typeof item === "object") {
        return Object.keys(item).length > 0
      }

      return item !== ""
    })
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entry]) => [key, cleanStructuredData(entry)])
        .filter(([, entry]) => {
          if (entry == null) {
            return false
          }

          if (Array.isArray(entry)) {
            return entry.length > 0
          }

          if (typeof entry === "object") {
            return Object.keys(entry).length > 0
          }

          return entry !== ""
        })
    )
  }

  return value
}

function setMetaDescription(content) {
  const tag = document.querySelector('meta[name="description"]')
  if (tag) {
    tag.setAttribute("content", content)
  }
}

function setMetaTag(attributeName, attributeValue, content) {
  let tag = document.querySelector(`meta[${attributeName}="${attributeValue}"]`)

  if (!tag) {
    tag = document.createElement("meta")
    tag.setAttribute(attributeName, attributeValue)
    document.head.appendChild(tag)
  }

  tag.setAttribute("content", content)
}

function replaceMultiMeta(attributeName, attributeValue, values) {
  document.querySelectorAll(`meta[${attributeName}="${attributeValue}"]`).forEach((tag) => {
    tag.remove()
  })

  values.forEach((value) => {
    const tag = document.createElement("meta")
    tag.setAttribute(attributeName, attributeValue)
    tag.setAttribute("content", value)
    document.head.appendChild(tag)
  })
}

function setCanonicalUrl(href) {
  let tag = document.getElementById("canonical-link")

  if (!tag) {
    tag = document.createElement("link")
    tag.id = "canonical-link"
    tag.rel = "canonical"
    document.head.appendChild(tag)
  }

  tag.setAttribute("href", href)
}

function getSectionPlainText(sections, id) {
  const section = sections.find((entry) => entry.id === id)

  if (!section?.html) {
    return ""
  }

  const wrapper = document.createElement("div")
  wrapper.innerHTML = section.html
  return wrapper.textContent?.replace(/\s+/g, " ").trim() || ""
}

function uniqueNonPlaceholderAffiliations(authors) {
  const labels = authors
    .map((author) => (author.affiliation || "").trim())
    .filter(Boolean)
    .filter((label) => !/^add affiliation$/i.test(label))

  return Array.from(new Set(labels))
}

function showError(node, message) {
  if (!node) {
    return
  }

  node.hidden = false
  node.textContent = message
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function escapeAttribute(value) {
  return escapeHtml(value)
}
