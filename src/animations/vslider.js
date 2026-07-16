import gsap from 'gsap/dist/gsap'

const VSLIDER_IMAGE_SELECTOR = '.vslider_image'
let vsliderInitialized = false

export function initVSlider(scope = document) {
    if (vsliderInitialized) return

    const images = scope.querySelectorAll(VSLIDER_IMAGE_SELECTOR)
    if (!images.length) return

    images.forEach((image) => {
        gsap.to(image, {
            width: '92%',
            ease: 'none',
            scrollTrigger: {
                trigger: image,
                start: 'center center',
                once: true
            }
        })
    })

    vsliderInitialized = true
}
