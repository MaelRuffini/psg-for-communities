import Swiper from 'swiper'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

const JOURNAL_LIST_SELECTOR = '.journal_cl'
const JOURNAL_ITEM_SELECTOR = '.journal_cl_item'
const JOURNAL_WRAPPER_SELECTOR = '.journal_cl_wrap'
const JOURNAL_LAYOUT_SELECTOR = '.journal_layout'
const JOURNAL_PAGINATION_INDEX_SELECTOR = '.journal_pagination_index'
const JOURNAL_ITEMS_PER_PAGE = 3
const ACTIVE_CLASS = 'is--active'
const MOBILE_BREAKPOINT = 480
const DISABLE_ON_MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

let vsliderInitialized = false

function prepareSliderStructure(list) {
    const items = list.querySelectorAll(JOURNAL_ITEM_SELECTOR)
    if (!items.length) return null

    const container = list.closest(JOURNAL_WRAPPER_SELECTOR) || list.parentElement
    if (!container) return null

    container.classList.add('swiper')
    list.classList.add('swiper-wrapper')
    items.forEach((item) => item.classList.add('swiper-slide'))

    return { container }
}

function bindPagination(list, swiper) {
    const section = list.closest(JOURNAL_LAYOUT_SELECTOR) || list.parentElement
    if (!section) return

    const paginationIndexes = section.querySelectorAll(JOURNAL_PAGINATION_INDEX_SELECTOR)
    if (!paginationIndexes.length) return

    const setActivePagination = () => {
        const activePage = Math.floor(swiper.activeIndex / JOURNAL_ITEMS_PER_PAGE)
        paginationIndexes.forEach((indexElement, index) => {
            indexElement.classList.toggle(ACTIVE_CLASS, index === activePage)
        })
    }

    paginationIndexes.forEach((indexElement, index) => {
        indexElement.addEventListener('click', (event) => {
            event.preventDefault()
            const targetSlide = index * JOURNAL_ITEMS_PER_PAGE
            swiper.slideTo(targetSlide)
        })
    })

    swiper.on('slideChange', setActivePagination)
    setActivePagination()
}

export function initVSlider(scope = document) {
    if (vsliderInitialized) return
    if (window.matchMedia(DISABLE_ON_MOBILE_QUERY).matches) return

    const lists = scope.querySelectorAll(JOURNAL_LIST_SELECTOR)
    if (!lists.length) return

    lists.forEach((list) => {
        const prepared = prepareSliderStructure(list)
        if (!prepared) return

        const instance = new Swiper(prepared.container, {
            modules: [Autoplay],
            slidesPerView: 'auto',
            slidesPerGroup: JOURNAL_ITEMS_PER_PAGE,
            spaceBetween: 0,
            speed: 700,
            grabCursor: true,
            watchOverflow: true,
            autoplay: {
                delay: 15000,
                disableOnInteraction: false
            }
        })

        bindPagination(list, instance)
    })

    vsliderInitialized = true
}
