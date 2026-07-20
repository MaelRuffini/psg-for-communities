import gsap from 'gsap/dist/gsap'

const FAQ_ITEM_SELECTOR = '.faq_item'
const FAQ_TOGGLE_SELECTOR = '.faq_toggle'
const FAQ_ICON_VERTICAL_LINE_SELECTOR = '.faq_icon_line--vertical'

let faqAnimationInitialized = false

function notifyContentResized() {
    requestAnimationFrame(() => {
        window.dispatchEvent(new Event('content:resized'))
    })
}

export function initFaqAnimation(scope = document) {
    if (faqAnimationInitialized) return

    const items = scope.querySelectorAll(FAQ_ITEM_SELECTOR)
    if (!items.length) return

    items.forEach((item, index) => {
        const toggle = item.querySelector(FAQ_TOGGLE_SELECTOR)
        if (!toggle) return

        const verticalLine = item.querySelector(FAQ_ICON_VERTICAL_LINE_SELECTOR)
        const openByDefault = index === 0

        gsap.set(toggle, {
            height: openByDefault ? 'auto' : 0,
            overflow: 'hidden'
        })

        if (verticalLine) {
            gsap.set(verticalLine, { height: openByDefault ? 0 : '6px' })
        }

        item.dataset.faqOpen = String(openByDefault)

        item.addEventListener('click', () => {
            const isOpen = item.dataset.faqOpen === 'true'

            gsap.to(toggle, {
                height: isOpen ? 0 : 'auto',
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: notifyContentResized
            })

            if (verticalLine) {
                gsap.to(verticalLine, {
                    height: isOpen ? '6px' : 0,
                    duration: 0.6,
                    ease: 'power2.inOut'
                })
            }

            item.dataset.faqOpen = String(!isOpen)
        })
    })

    faqAnimationInitialized = true
}
