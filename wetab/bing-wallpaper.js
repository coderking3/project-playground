// ========== 配置 ==========
const wallpaperApi = 'https://bing.ee123.net/img/4k' // Bing壁纸API
const STORAGE_KEY = 'bingWallpaperMode' // 模式开关缓存key
const CACHE_KEY = 'bingWallpaperCache' // 壁纸缓存key

// ========== 辅助函数 ==========

// 获取今天的日期字符串 (YYYY-MM-DD)
function getTodayString() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(today.getDate()).padStart(2, '0')}`
}

// 获取缓存的壁纸数据
function getCachedWallpaper() {
  const cached = localStorage.getItem(CACHE_KEY)
  if (!cached) return null

  try {
    const data = JSON.parse(cached)
    // 检查是否是今天的缓存
    if (data.date === getTodayString()) {
      return data
    }
  } catch (e) {
    console.error('解析壁纸缓存失败:', e)
  }
  return null
}

// 保存壁纸缓存
function setCachedWallpaper(newUrl, oldUrl) {
  const cacheData = {
    date: getTodayString(),
    newUrl: newUrl,
    oldUrl: oldUrl,
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
}

const getWallpaperElement = () =>
  document.querySelector('.home-wallpaper .transition-wallpaper')

// 获取当前DOM中的壁纸URL
function getCurrentDomWallpaperUrl() {
  const wallpaperEl = getWallpaperElement()
  if (!wallpaperEl) return null

  const bgImage = wallpaperEl.style.backgroundImage
  if (!bgImage) return null

  // 从 url("...") 中提取URL
  const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/)
  return match ? match[1] : null
}

// 获取Bing壁纸真实URL
async function fetchBingWallpaperUrl() {
  try {
    const response = await fetch(wallpaperApi)
    // 获取重定向后的真实URL
    return response.url
  } catch (e) {
    console.error('获取Bing壁纸失败:', e)
    return null
  }
}

// 设置壁纸
async function setWallpaper() {
  const wallpaperEl = getWallpaperElement()
  if (!wallpaperEl) return

  // 检查缓存
  const cached = getCachedWallpaper()

  let newUrl, oldUrl

  // 如果有今日缓存,直接使用
  if (cached && cached.newUrl && cached.oldUrl) {
    newUrl = cached.newUrl
    oldUrl = cached.oldUrl
    console.log('使用缓存的Bing壁纸')
  } else {
    // 需要重新请求新壁纸
    // 从DOM获取旧壁纸URL(仅在没有缓存时)
    oldUrl = getCurrentDomWallpaperUrl()

    // 请求获取真实的Bing壁纸URL
    newUrl = await fetchBingWallpaperUrl()

    if (!newUrl) {
      console.error('无法获取Bing壁纸URL')
      return
    }

    console.log('请求新的Bing壁纸:', newUrl)

    // 保存到缓存
    setCachedWallpaper(newUrl, oldUrl)
  }

  // 应用壁纸(带淡入淡出效果)
  wallpaperEl.style.transition = 'opacity 0.8s ease-in-out'
  wallpaperEl.style.opacity = '0'

  setTimeout(() => {
    wallpaperEl.style.backgroundImage = `url("${newUrl}")`
    wallpaperEl.style.backgroundPosition = 'center center'
    wallpaperEl.style.backgroundSize = 'cover'
    wallpaperEl.style.opacity = '1'
  }, 400)
}

// 创建切换按钮
function createToggleButton() {
  if (document.getElementById('bing-wallpaper-toggle')) return

  // 图片/壁纸相关的SVG图标(Base64编码)
  const iconSvg =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgeD0iMyIgeT0iMyIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjIiLz48cGF0aCBkPSJtMjEgMTUtMy4wODYtMy4wODZhMiAyIDAgMCAwLTIuODI4IDBMNiAyMSIvPjwvc3ZnPg=='

  // 创建外层 section
  const btn = document.createElement('section')
  btn.id = 'bing-wallpaper-toggle'
  btn.className =
    'absolute left-[20px] top-[20px] h-[36px] w-[36px] cursor-pointer rounded-[8px] p-[4px] text-[rgba(255,255,255,0.6)] transition-colors hover:bg-[rgba(0,0,0,0.15)] hover:text-[rgba(255,255,255,1)]'

  // 创建内层 section (存储 SVG mask)
  const iconSection = document.createElement('section')
  iconSection.className = 'h-full w-full bg-current'
  iconSection.style.cssText = `
    mask-image: url("${iconSvg}");
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-image: url("${iconSvg}");
    -webkit-mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
  `

  btn.appendChild(iconSection)

  // 读取缓存状态
  let enabled = localStorage.getItem(STORAGE_KEY) === 'true'

  // 根据状态调整样式
  if (enabled) {
    btn.classList.add('text-[rgba(255,255,255,1)]', 'bg-[rgba(0,0,0,0.15)]')
  }

  btn.addEventListener('click', () => {
    enabled = !enabled
    localStorage.setItem(STORAGE_KEY, enabled)

    // 切换样式
    if (enabled) {
      btn.classList.add('text-[rgba(255,255,255,1)]', 'bg-[rgba(0,0,0,0.15)]')
      setWallpaper()
    } else {
      btn.classList.remove(
        'text-[rgba(255,255,255,1)]',
        'bg-[rgba(0,0,0,0.15)]'
      )

      // 关闭模式时,恢复原壁纸
      const wallpaperEl = getWallpaperElement()
      const cached = getCachedWallpaper()
      if (wallpaperEl && cached && cached.oldUrl) {
        wallpaperEl.style.transition = 'opacity 0.8s ease-in-out'
        wallpaperEl.style.opacity = '0'
        setTimeout(() => {
          wallpaperEl.style.backgroundImage = `url("${cached.oldUrl}")`
          wallpaperEl.style.opacity = '1'
        }, 400)
      }
    }
  })

  document.body.appendChild(btn)
}

// ========== 核心逻辑 ==========

// MutationObserver 监听 DOM 变化
const observer = new MutationObserver(() => {
  const wallpaperEl = getWallpaperElement()
  if (wallpaperEl) {
    createToggleButton()

    // 如果模式开启,自动替换壁纸
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setWallpaper()
    }

    observer.disconnect() // 找到元素后停止观察
  }
})

observer.observe(document.body, { childList: true, subtree: true })
