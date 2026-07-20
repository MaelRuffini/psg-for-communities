import gsap from 'gsap/dist/gsap'
import ScrollTrigger from 'gsap/dist/ScrollTrigger'

const IMAGE_WRAPPER_SELECTOR = '[data-animate="image-wrapper"]'
const IMAGE_SELECTOR = '[data-animate="image"]'

let imagesAnimationInitialized = false

function createImageAnimation(wrapper) {
    if (!wrapper) return

    const image = wrapper.querySelector(IMAGE_SELECTOR)
    if (!image) return

    const tween = gsap.fromTo(
        image,
        { yPercent: 0 },
        { yPercent: 20, ease: 'none' }
    )

    ScrollTrigger.create({
        trigger: wrapper,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        animation: tween
    })
}

export function initImagesAnimation(scope = document) {
    if (imagesAnimationInitialized) return

    const wrappers = scope.querySelectorAll(IMAGE_WRAPPER_SELECTOR)
    if (!wrappers.length) return

    wrappers.forEach((wrapper) => {
        createImageAnimation(wrapper)
    })

    imagesAnimationInitialized = true
}
