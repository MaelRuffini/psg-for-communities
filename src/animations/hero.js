import gsap from 'gsap/dist/gsap'
import ScrollTrigger from 'gsap/dist/ScrollTrigger'
import SplitType from 'split-type'

const HERO_TRIGGER_SELECTOR = '.hero_wrap'
const HERO_TARGET_SELECTOR = '.hero_background_scale'
const HERO_BACKGROUND_TEXT_SELECTOR = '.hero_background_text'
const HERO_BACKGROUND_LOGO_SELECTOR = '.hero_background_logo'
const HERO_HEADING_SELECTOR = '.hero_heading'
const HERO_LOGO_SELECTOR = '.hero_logo'
const HERO_PATH_SELECTOR = '.hero_path'
const HERO_MARQUEE_ITEM_SELECTOR = '.hero_marquee_item'
const HERO_MOBILE_BREAKPOINT = 480
const MOBILE_VIEWPORT_UI_DELTA_MAX = 140

const state = {
    scaleInitialized: false,
    backgroundRevealInitialized: false,
    headingInitialized: false,
    arrowInitialized: false,
    marqueeInitialized: false,
    headingSplit: null,
    headingTween: null,
    headingTrigger: null,
    headingResizeBound: false
}

function hasElements(...elements) {
    return elements.every(Boolean)
}

function hasItems(collection) {
    return Boolean(collection?.length)
}

function debounce(fn, delay = 180) {
    let timeoutId = null

    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay)
    }
}

function createHeroScaleAnimation(trigger, target) {
    if (!hasElements(trigger, target)) return

    const mm = gsap.matchMedia()

    mm.add(
        {
            isMobile: `(max-width: ${HERO_MOBILE_BREAKPOINT - 1}px)`,
            isDesktop: `(min-width: ${HERO_MOBILE_BREAKPOINT}px)`,
            reduceMotion: '(prefers-reduced-motion: reduce)'
        },
        (context) => {
            const { isMobile, reduceMotion } = context.conditions
            const width = isMobile ? '20rem' : '29.875rem'
            const height = isMobile ? '20rem' : '16.8046875rem'

            if (reduceMotion) {
                gsap.set(target, { width, height })
                return
            }

            gsap.fromTo(
                target,
                { width: '100%', height: '100%' },
                {
                    width,
                    height,
                    ease: 'none',
                    scrollTrigger: {
                        trigger,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: true,
                        invalidateOnRefresh: true
                    }
                }
            )
        }
    )
}

function createHeroBackgroundRevealAnimation(trigger, text, logo) {
    if (!trigger || (!text && !logo)) return

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

    if (text) {
        tl.from(
            text,
            {
                yPercent: 100,
                duration: 0.8
            },
            0
        )
    }

    if (logo) {
        tl.from(
            logo,
            {
                y: '1rem',
                opacity: 0,
                duration: 0.8
            },
            0.08
        )
    }

    ScrollTrigger.create({
        trigger,
        start: '90% bottom',
        toggleActions: 'play none none reverse',
        animation: tl
    })
}

function collapsePathDataToPoint(pathData, x, y) {
    let isX = true
    return pathData.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, () => {
        const value = isX ? x : y
        isX = !isX
        return Number(value.toFixed(6)).toString()
    })
}

function createHeroArrowEraseAnimation(trigger, paths) {
    if (!trigger || !hasItems(paths)) return

    const tl = gsap.timeline({ defaults: { ease: 'power1.inOut' } })

    paths.forEach((path, index) => {
        path.removeAttribute('mask')
        gsap.set(path, { opacity: 1 })

        const originalPathData = path.getAttribute('d')
        if (!originalPathData) return

        const box = path.getBBox()
        const collapseX = box.x + box.width / 2
        const collapseY = box.y + box.height
        const collapsedPathData = collapsePathDataToPoint(
            originalPathData,
            collapseX,
            collapseY
        )

        tl.to(
            path,
            {
                morphSVG: {
                    shape: collapsedPathData,
                    shapeIndex: 'auto'
                },
                duration: 0.65,
                ease: 'power2.inOut'
            },
            index * 0.08
        )
    })

    if (!tl.getChildren().length) return

    ScrollTrigger.create({
        trigger,
        start: 'top+=10 top',
        toggleActions: 'play none none reverse',
        animation: tl,
        invalidateOnRefresh: true
    })
}

function cleanupHeroHeadingAnimation() {
    state.headingTrigger?.kill()
    state.headingTween?.kill()
    state.headingSplit?.revert()
    state.headingTrigger = null
    state.headingTween = null
    state.headingSplit = null
}

function buildHeroHeadingAnimation(trigger, heading, heroLogo) {
    if (!hasElements(trigger, heading)) return

    cleanupHeroHeadingAnimation()
    if (heroLogo) gsap.set(heroLogo, { opacity: 1 })

    state.headingSplit = new SplitType(heading, {
        types: 'lines',
        lineClass: 'hero-heading-line'
    })

    if (!state.headingSplit.lines || !state.headingSplit.lines.length) return

    state.headingSplit.lines.forEach((line) => {
        const mask = document.createElement('div')
        mask.classList.add('hero-heading-line-mask')
        line.parentNode.insertBefore(mask, line)
        mask.appendChild(line)
    })

    state.headingTween = gsap.timeline({ defaults: { ease: 'power1.inOut' } })

    state.headingTween.to(
        state.headingSplit.lines,
        {
            yPercent: -100,
            stagger: 0.08
        },
        0
    )

    if (heroLogo) {
        state.headingTween.to(
            heroLogo,
            {
                opacity: 0,
                duration: 0.4
            },
            0
        )
    }

    state.headingTrigger = ScrollTrigger.create({
        trigger,
        start: 'top+=10 top',
        toggleActions: 'play none none reverse',
        animation: state.headingTween,
        invalidateOnRefresh: true
    })
}

function initHeroScaleAnimation(scope = document) {
    if (state.scaleInitialized) return

    const trigger = scope.querySelector(HERO_TRIGGER_SELECTOR)
    const target = scope.querySelector(HERO_TARGET_SELECTOR)
    if (!hasElements(trigger, target)) return

    createHeroScaleAnimation(trigger, target)
    state.scaleInitialized = true
}

function initHeroBackgroundRevealAnimation(scope = document) {
    if (state.backgroundRevealInitialized) return

    const trigger = scope.querySelector(HERO_TRIGGER_SELECTOR)
    const text = scope.querySelector(HERO_BACKGROUND_TEXT_SELECTOR)
    const logo = scope.querySelector(HERO_BACKGROUND_LOGO_SELECTOR)
    if (!trigger || (!text && !logo)) return

    createHeroBackgroundRevealAnimation(trigger, text, logo)
    state.backgroundRevealInitialized = true
}

function initHeroHeadingAnimation(scope = document) {
    if (state.headingInitialized) return

    const trigger = scope.querySelector(HERO_TRIGGER_SELECTOR)
    const heading = scope.querySelector(HERO_HEADING_SELECTOR)
    const heroLogo = scope.querySelector(HERO_LOGO_SELECTOR)
    if (!hasElements(trigger, heading)) return

    buildHeroHeadingAnimation(trigger, heading, heroLogo)

    if (!state.headingResizeBound) {
        let previousWidth = window.innerWidth
        let previousHeight = window.innerHeight
        const handleResize = debounce(() => {
            const width = window.innerWidth
            const height = window.innerHeight
            const widthDelta = Math.abs(width - previousWidth)
            const heightDelta = Math.abs(height - previousHeight)
            const isMobile = window.matchMedia(
                `(max-width: ${HERO_MOBILE_BREAKPOINT - 1}px)`
            ).matches
            const isLikelyMobileBrowserUiResize =
                isMobile &&
                widthDelta === 0 &&
                heightDelta > 0 &&
                heightDelta <= MOBILE_VIEWPORT_UI_DELTA_MAX

            previousWidth = width
            previousHeight = height
            if (isLikelyMobileBrowserUiResize) return

            buildHeroHeadingAnimation(trigger, heading, heroLogo)
            ScrollTrigger.refresh()
        })

        window.addEventListener('resize', handleResize)
        state.headingResizeBound = true
    }

    state.headingInitialized = true
}

function initHeroArrowAnimation(scope = document) {
    if (state.arrowInitialized) return

    const trigger = scope.querySelector(HERO_TRIGGER_SELECTOR)
    const paths = scope.querySelectorAll(HERO_PATH_SELECTOR)
    if (!trigger || !hasItems(paths)) return

    createHeroArrowEraseAnimation(trigger, paths)
    state.arrowInitialized = true
}

function initHeroMarqueeAnimation(scope = document) {
    if (state.marqueeInitialized) return

    const marqueeItems = scope.querySelectorAll(HERO_MARQUEE_ITEM_SELECTOR)
    if (!hasItems(marqueeItems)) return

    gsap.to(marqueeItems, {
        x: '-100%',
        ease: 'none',
        repeat: -1,
        duration: 50
    })

    state.marqueeInitialized = true
}

export function initHeroAnimations(scope = document) {
    initHeroScaleAnimation(scope)
    initHeroBackgroundRevealAnimation(scope)
    initHeroHeadingAnimation(scope)
    initHeroArrowAnimation(scope)
    initHeroMarqueeAnimation(scope)
}
