import gsap from 'gsap/dist/gsap'
import SplitType from 'split-type'

const TITLE_SELECTOR = '[data-animation="title"]'

let titleAnimationInitialized = false

function createTitleAnimation(element) {
    if (!element) return

    const split = new SplitType(element, {
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
