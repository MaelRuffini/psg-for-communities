import Swiper from 'swiper'
import 'swiper/css'

const MOBILE_BREAKPOINT = 480
const VSLIDER_ROOT_SELECTOR = '.vslider_slot_wrap'
const VSLIDER_WRAPPER_SELECTOR = '.vslider_slot'
const VSLIDER_SLIDE_SELECTOR = '.vslider_item_row'
const VSLIDER_DISABLE_ON_MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

let vsliderInitialized = false
let vsliderInstances = []

function prepareVSliderStructure(slider) {
    const inner = slider.querySelector(VSLIDER_WRAPPER_SELECTOR)
    if (!inner) return null

    const items = inner.querySelectorAll(VSLIDER_SLIDE_SELECTOR)
    if (!items.length) return null

    slider.classList.add('swiper')
    inner.classList.add('swiper-wrapper')
    items.forEach((item) => item.classList.add('swiper-slide'))

    return { totalItems: items.length, items }
}

export function initVSlider(scope = document) {
    if (vsliderInitialized) return

    if (window.matchMedia(VSLIDER_DISABLE_ON_MOBILE_QUERY).matches) {
        return
    }

    const sliders = scope.querySelectorAll(VSLIDER_ROOT_SELECTOR)
    if (!sliders.length) return

    sliders.forEach((slider) => {
        const prepared = prepareVSliderStructure(slider)
        if (!prepared || prepared.totalItems < 2) return

        const instance = new Swiper(slider, {
            direction: 'vertical',
            centeredSlides: true,
            slidesPerView: 'auto',
            speed: 900,
            loop: false,
            loopedSlides: prepared.totalItems,
            loopAdditionalSlides: prepared.totalItems,
            allowTouchMove: false
        })

        const logLoopState = (label) => {
            const duplicateCount = slider.querySelectorAll('.swiper-slide-duplicate').length
        }

        requestAnimationFrame(() => {
            logLoopState('after init')
        })

        instance.on('slideChange', () => logLoopState('slideChange'))
        instance.on('loopFix', () => logLoopState('loopFix'))

        // Click top half for previous, bottom half for next.
        slider.addEventListener('click', (event) => {
            const clickedSlide = event.target.closest('.swiper-slide')
            if (clickedSlide) {
                const rawIndex = clickedSlide.getAttribute('data-swiper-slide-index')
                const clickedIndex =
                    rawIndex !== null
                        ? Number(rawIndex)
                        : Array.from(prepared.items).indexOf(clickedSlide)
                if (clickedIndex !== -1 && clickedIndex !== instance.realIndex) {
                    instance.slideToLoop(clickedIndex)
                    return
                }
            }

            const bounds = slider.getBoundingClientRect()
            const clickY = event.clientY - bounds.top
            const isTopHalf = clickY < bounds.height / 2

            if (isTopHalf) {
                instance.slidePrev()
            } else {
                instance.slideNext()
            }
        })

        vsliderInstances.push(instance)
    })

    vsliderInitialized = true
}
