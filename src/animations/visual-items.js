import gsap from 'gsap/dist/gsap'

const VISUAL_WRAP_SELECTOR = '.visual_wrap'
const VISUAL_ITEM_SELECTOR = '.visual_item'

let visualItemsAnimationInitialized = false

export function initVisualItemsAnimation(scope = document) {
    if (visualItemsAnimationInitialized) return

    const trigger = scope.querySelector(VISUAL_WRAP_SELECTOR)
    const items = scope.querySelectorAll(VISUAL_ITEM_SELECTOR)
    if (!trigger || !items.length) return

    gsap.from(items, {
        rotation: 0,
        duration: 0.9,
        stagger: {
            amount: 0.08,
            from: 'center center'
        },
        ease: 'power2.out',
        scrollTrigger: {
            trigger,
            start: 'top 60%',
            once: true
        }
    })

    visualItemsAnimationInitialized = true
}
