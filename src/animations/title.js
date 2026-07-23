import gsap from 'gsap/dist/gsap'
import SplitType from 'split-type'

const TITLE_SELECTOR = '[data-animation="title"]'
const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6'

let titleAnimationInitialized = false

function getTitleTarget(element) {
    if (!element) return null
    if (/^H[1-6]$/i.test(element.tagName)) return element

    return element.querySelector(HEADING_SELECTOR) || element
}

function createTitleAnimation(element) {
    const target = getTitleTarget(element)
    if (!target) return

    const split = new SplitType(target, {
        types: 'words',
        wordClass: 'title-word'
    })

    if (!split.words?.length) return

    gsap.from(split.words, {
        opacity: 0,
        duration: 0.8,
        ease: 'power1.inOut',
        stagger: 0.06,
        scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            once: true
        }
    })
}

export function initTitleAnimation(scope = document) {
    if (titleAnimationInitialized) return

    const titles = scope.querySelectorAll(TITLE_SELECTOR)
    if (!titles.length) return

    titles.forEach((title) => {
        createTitleAnimation(title)
    })

    titleAnimationInitialized = true
}
