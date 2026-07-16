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

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin)

const MOBILE_BREAKPOINT = 480
const VSLIDER_DISABLE_ON_MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1
    }px)`

let lenis = null
let viewportReloadBound = false

// ----------------------------
// Lenis
// ----------------------------

function initLenis() {
    if (lenis) return lenis

    lenis = new Lenis({
        autoRaf: true
    })

    lenis.on('scroll', ScrollTrigger.update)
    window.addEventListener('load', () => ScrollTrigger.refresh())

    return lenis
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

document.addEventListener('DOMContentLoaded', () => {
    initViewportBreakpointReload()
    initLenis()
    initPanelAnimation()
    initHeroAnimations()
    initFaqAnimation()
    initFooterAnimation()
    initNumbersAnimation()
    initVisualItemsAnimation()
    initVSlider()
})
