import gsap from 'gsap/dist/gsap'

const NUMBERS_WRAP_SELECTOR = '.numbers_wrap'
const NUMBERS_ITEM_SELECTOR = '.numbers_header_overlay'
const MOBILE_BREAKPOINT = 480

let numbersAnimationInitialized = false

export function initNumbersAnimation(scope = document) {
    if (numbersAnimationInitialized) return

    const wraps = scope.querySelectorAll(NUMBERS_WRAP_SELECTOR)
    if (!wraps.length) return

    const mm = gsap.matchMedia()
    mm.add(
        {
            isMobile: `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
        },
        (context) => {
            if (context.conditions.isMobile) return

            wraps.forEach((wrap) => {
                const items = wrap.querySelectorAll(NUMBERS_ITEM_SELECTOR)
                if (!items.length) return

                gsap.fromTo(
                    items,
                    { scaleY: 0.1 },
                    {
                        scaleY: 1,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: wrap,
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: true
                        }
                    }
                )
            })
        }
    )

    numbersAnimationInitialized = true
}
