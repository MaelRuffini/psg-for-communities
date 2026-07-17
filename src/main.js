import './styles/style.css'
import Lenis from 'lenis'
import gsap from 'gsap/dist/gsap'
import ScrollTrigger from 'gsap/dist/ScrollTrigger'
import MorphSVGPlugin from 'gsap/dist/MorphSVGPlugin'
import { initHeroAnimations } from './animations/hero'
import { initFaqAnimation } from './animations/faq'
import { initFooterAnimation } from './animations/footer'
import { initNumbersAnimation } from './animations/numbers'
import { initPanelAnimation } from './animations/panel'
import { initVisualItemsAnimation } from './animations/visual-items'
import { initVSlider } from './animations/vslider'
import { initKpisAnimation } from './animations/kpis'

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin)

const MOBILE_BREAKPOINT = 480
const VSLIDER_DISABLE_ON_MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1
    }px)`
const MOBILE_VIEWPORT_UI_DELTA_MAX = 140
const SCROLL_END_MS = 200

let lenis = null
let viewportReloadBound = false
let lenisResizeBound = false
let isUserScrolling = false
let pendingResizeRefresh = false
let scrollEndTimer = null

// ----------------------------
// Lenis
// ----------------------------

function initLenis() {
    if (lenis) return lenis

    lenis = new Lenis({
        autoRaf: true,
        autoResize: false
    })

    lenis.on('scroll', () => {
        ScrollTrigger.update()
        markScrolling()
    })
    bindLenisResize(lenis)
    window.addEventListener('load', () => refreshScrollSystem())

    return lenis
}

function refreshScrollSystem() {
    if (!lenis) return

    lenis.resize()
    ScrollTrigger.refresh()
}

function flushPendingResizeRefresh() {
    if (!pendingResizeRefresh) return

    pendingResizeRefresh = false
    refreshScrollSystem()
}

function markScrolling() {
    isUserScrolling = true
    if (scrollEndTimer) clearTimeout(scrollEndTimer)

    scrollEndTimer = setTimeout(() => {
        isUserScrolling = false
        flushPendingResizeRefresh()
    }, SCROLL_END_MS)
}

function bindLenisResize(instance) {
    if (lenisResizeBound || !instance) return

    let frame = null
    let previousWidth = window.innerWidth
    let previousHeight = window.innerHeight

    const handleResize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        const widthDelta = Math.abs(width - previousWidth)
        const heightDelta = Math.abs(height - previousHeight)
        const isMobile = window.matchMedia(VSLIDER_DISABLE_ON_MOBILE_QUERY).matches
        const isLikelyMobileBrowserUiResize =
            isMobile &&
            widthDelta === 0 &&
            heightDelta > 0 &&
            heightDelta <= MOBILE_VIEWPORT_UI_DELTA_MAX

        if (!isLikelyMobileBrowserUiResize) {
            if (isUserScrolling) {
                pendingResizeRefresh = true
            } else {
                refreshScrollSystem()
            }
        }

        previousWidth = width
        previousHeight = height
    }

    window.addEventListener('resize', () => {
        if (frame) cancelAnimationFrame(frame)
        frame = requestAnimationFrame(handleResize)
    })
    window.addEventListener('content:resized', () => {
        if (isUserScrolling) {
            pendingResizeRefresh = true
        } else {
            refreshScrollSystem()
        }
    })
    window.addEventListener('touchstart', markScrolling, { passive: true })
    window.addEventListener('touchmove', markScrolling, { passive: true })
    window.addEventListener('wheel', markScrolling, { passive: true })

    lenisResizeBound = true
}

function initViewportBreakpointReload() {
    if (viewportReloadBound) return

    const mediaQuery = window.matchMedia(VSLIDER_DISABLE_ON_MOBILE_QUERY)
    const handleChange = () => {
        window.location.reload()
    }

    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange)
    } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handleChange)
    }

    viewportReloadBound = true
}

function initModalControls() {
    const modalButtons = document.querySelectorAll('.button_modal')
    const modal = document.querySelector('.modal_wrap')
    const closeButtons = document.querySelectorAll('.modal_close_button')
    const modalBackgrounds = document.querySelectorAll('.modal_background')

    if (!modalButtons.length || !modal) return
    if (!closeButtons.length && !modalBackgrounds.length) return

    const FADE_DURATION_MS = 250
    let hideTimer = null

    modal.style.transition = `opacity ${FADE_DURATION_MS}ms ease`
    modal.style.willChange = 'opacity'

    const isInitiallyVisible = window.getComputedStyle(modal).display !== 'none'
    if (isInitiallyVisible) {
        modal.style.opacity = '1'
        modal.style.visibility = 'visible'
        modal.style.pointerEvents = 'auto'
    } else {
        modal.style.opacity = '0'
        modal.style.visibility = 'hidden'
        modal.style.pointerEvents = 'none'
    }

    const openModal = () => {
        if (hideTimer) {
            clearTimeout(hideTimer)
            hideTimer = null
        }

        modal.style.display = 'flex'
        requestAnimationFrame(() => {
            modal.style.opacity = '1'
            modal.style.visibility = 'visible'
            modal.style.pointerEvents = 'auto'
        })
    }

    const closeModal = () => {
        modal.style.opacity = '0'
        modal.style.visibility = 'hidden'
        modal.style.pointerEvents = 'none'

        hideTimer = setTimeout(() => {
            modal.style.display = 'none'
            hideTimer = null
        }, FADE_DURATION_MS)
    }

    modalButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault()
            openModal()
        })
    })

    closeButtons.forEach((closeButton) => {
        closeButton.addEventListener('click', (event) => {
            event.preventDefault()
            closeModal()
        })
    })

    modalBackgrounds.forEach((background) => {
        background.addEventListener('click', (event) => {
            event.preventDefault()
            closeModal()
        })
    })
}

document.addEventListener('DOMContentLoaded', () => {
    initViewportBreakpointReload()
    initLenis()
    initModalControls()
    initPanelAnimation()
    initHeroAnimations()
    initFaqAnimation()
    initFooterAnimation()
    initNumbersAnimation()
    initVisualItemsAnimation()
    initVSlider()
    initKpisAnimation()
})
