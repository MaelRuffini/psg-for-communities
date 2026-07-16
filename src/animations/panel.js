import gsap from 'gsap/dist/gsap'
import ScrollTrigger from 'gsap/dist/ScrollTrigger'

const WRAPPER_SELECTOR = '[data-animate="wrapper"]'
const CONTENT_SELECTOR = '[data-animate="content"]'

let panelAnimationInitialized = false

function createWrapperAnimation(wrapper) {
    if (!wrapper) return

    const content = wrapper.querySelector(CONTENT_SELECTOR)
    if (!content) return

    const tween = gsap.fromTo(
        content,
        { y: '-60vh' },
        { y: '0vh', ease: 'none' }
    )

    ScrollTrigger.create({
        trigger: wrapper,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        animation: tween
    })
}

export function initPanelAnimation(scope = document) {
    if (panelAnimationInitialized) return

    const wrappers = scope.querySelectorAll(WRAPPER_SELECTOR)
    if (!wrappers.length) return

    wrappers.forEach((wrapper) => {
        createWrapperAnimation(wrapper)
    })

    panelAnimationInitialized = true
}
