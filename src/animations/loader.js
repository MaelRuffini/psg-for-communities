import gsap from 'gsap/dist/gsap'

const LOADER_WRAP_SELECTOR = '.loader_wrap'
const LOADER_IMAGE_SELECTOR = '.loader_image'
const LOADER_TAG_SELECTOR = '.loader_tag'
const LOADER_OVERLAY_SELECTOR = '.loader_image_overlay'

let loaderAnimationInitialized = false

export function initLoaderAnimation(scope = document) {
    if (loaderAnimationInitialized) return

    const wrap = scope.querySelector(LOADER_WRAP_SELECTOR)
    const images = scope.querySelectorAll(LOADER_IMAGE_SELECTOR)
    const tag = scope.querySelector(LOADER_TAG_SELECTOR)
    const overlay = scope.querySelector(LOADER_OVERLAY_SELECTOR)
    if (!wrap || !images.length || !tag || !overlay) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } })

    tl.fromTo(
        images,
        {
            opacity: 0,
            xPercent: 200
        },
        {
            opacity: 1,
            xPercent: 0,
            duration: 1.4,
            stagger: 0.08
        }
    )
        .from(
            tag,
            {
                yPercent: 100,
                duration: 1
            },
            '<'
        )
        .fromTo(
            overlay,
            {
                scale: 0,
                opacity: 0,
                duration: 1
            },
            {
                scale: 1,
                opacity: 1,
                duration: 1
            },
            '<'
        )
        // .to(images, {
        //     xPercent: -200,
        //     duration: 1.4,
        //     stagger: 0.08
        // })
        // .to(
        //     tag,
        //     {
        //         yPercent: -100,
        //         duration: 1
        //     },
        //     '<'
        // )
        // .to(
        //     overlay,
        //     {
        //         scale: 0,
        //         opacity: 0,
        //         duration: 1
        //     },
        //     '<'
        // )
        .to(
            wrap,
            {
                opacity: 0,
                duration: 1,
                onComplete: () => {
                    gsap.set(wrap, { display: 'none' })
                }
            }
        )

    loaderAnimationInitialized = true
}
