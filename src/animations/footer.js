import gsap from 'gsap/dist/gsap'

const FOOTER_WRAP_SELECTOR = '.footer_wrap'
const FOOTER_CONTAIN_SELECTOR = '.footer_contain'

let footerAnimationInitialized = false

export function initFooterAnimation(scope = document) {
    if (footerAnimationInitialized) return

    const wrap = scope.querySelector(FOOTER_WRAP_SELECTOR)
    if (!wrap) return

    const contain = wrap.querySelector(FOOTER_CONTAIN_SELECTOR)
    if (!contain) return

    gsap.from(contain, {
        y: '-60%',
        ease: 'none',
        scrollTrigger: {
            trigger: wrap,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true
        }
    })

    footerAnimationInitialized = true
}
