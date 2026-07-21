import gsap from 'gsap/dist/gsap'
import ScrollTrigger from 'gsap/dist/ScrollTrigger'

const KPIS_WRAP_SELECTOR = '.kpis_wrap'
const KPIS_TRACK_SELECTOR = '.kpis_cl'
const KPIS_ITEM_SELECTOR = '.kpis_cl_item'
const KPI_IMAGE_SELECTOR = '.kpis_cl_image'
const KPI_MAX_YAW_DEG = 18
const KPI_MIN_SCALE = 0.76
const KPI_MAX_SCALE = 1
const KPI_ENTRY_SCALE_MULTIPLIER_START = 0.9
const KPI_ENTRY_SCALE_RAMP_END_PROGRESS = 0.4
const KPI_CENTER_DEADZONE = 0
const KPI_IMAGE_PARALLAX_MAX_PERCENT = 10
const KPI_VIEWPORT_DISTANCE_MULTIPLIER = 1.7

let kpisAnimationInitialized = false
gsap.registerPlugin(ScrollTrigger)

export function initKpisAnimation(scope = document) {
    if (kpisAnimationInitialized) return

    const wrap = scope.querySelector(KPIS_WRAP_SELECTOR)
    if (!wrap) return

    const track = wrap.querySelector(KPIS_TRACK_SELECTOR)
    if (!track) return

    const items = track.querySelectorAll(KPIS_ITEM_SELECTOR)
    if (!items.length) return
    const images = Array.from(items, (item) => item.querySelector(KPI_IMAGE_SELECTOR))

    gsap.set(track, {
        yPercent: 0,
        perspective: 900,
        transformStyle: 'preserve-3d'
    })

    gsap.set(items, {
        rotationY: 0,
        scale: KPI_MIN_SCALE,
        transformOrigin: '50% 50%',
        transformStyle: 'preserve-3d',
        force3D: true,
        willChange: 'transform'
    })
    gsap.set(images.filter(Boolean), {
        xPercent: 0,
        force3D: true,
        willChange: 'transform'
    })

    const yawSetters = Array.from(items, (item) =>
        gsap.quickTo(item, 'rotationY', {
            duration: 0.28,
            ease: 'power2.out'
        })
    )
    const imageParallaxSetters = images.map((image) =>
        image
            ? gsap.quickTo(image, 'xPercent', {
                duration: 0.22,
                ease: 'power2.out'
            })
            : null
    )

    const updateItemYawByViewportPosition = (progress = 1) => {
        const viewportCenterX = window.innerWidth / 2
        const maxDistance = Math.max(
            viewportCenterX * KPI_VIEWPORT_DISTANCE_MULTIPLIER,
            1
        )
        const clampedProgress = gsap.utils.clamp(0, 1, progress)
        const entryRampProgress = gsap.utils.clamp(
            0,
            1,
            clampedProgress / KPI_ENTRY_SCALE_RAMP_END_PROGRESS
        )
        const entryScaleMultiplier = gsap.utils.interpolate(
            KPI_ENTRY_SCALE_MULTIPLIER_START,
            1,
            entryRampProgress
        )

        items.forEach((item, index) => {
            const rect = item.getBoundingClientRect()
            const itemCenterX = rect.left + rect.width / 2
            const normalizedOffset = (itemCenterX - viewportCenterX) / maxDistance
            const clampedOffset = gsap.utils.clamp(-1, 1, normalizedOffset)
            const centeredFactor = 1 - Math.abs(clampedOffset)
            const sideScale = KPI_MIN_SCALE * entryScaleMultiplier
            const isCentered = Math.abs(clampedOffset) <= KPI_CENTER_DEADZONE
            const targetScale = isCentered
                ? 1
                : gsap.utils.interpolate(sideScale, KPI_MAX_SCALE, centeredFactor)
            yawSetters[index](clampedOffset * KPI_MAX_YAW_DEG)
            gsap.set(item, { scale: targetScale })
            imageParallaxSetters[index]?.(
                -clampedOffset * KPI_IMAGE_PARALLAX_MAX_PERCENT
            )
        })
    }

    gsap.fromTo(
        track,
        {
            yPercent: 0
        },
        {
            yPercent: 70,
            ease: 'none',
            scrollTrigger: {
                trigger: wrap,
                start: 'bottom bottom',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true
            }
        }
    )

    gsap.fromTo(
        items,
        {
            xPercent: 100
        },
        {
            xPercent: () => -100 * items.length,
            ease: 'none',
            scrollTrigger: {
                trigger: wrap,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
                onEnter: (self) => updateItemYawByViewportPosition(self.progress),
                onEnterBack: (self) =>
                    updateItemYawByViewportPosition(self.progress),
                onUpdate: (self) => updateItemYawByViewportPosition(self.progress),
                onRefresh: (self) => updateItemYawByViewportPosition(self.progress)
            }
        }
    )

    updateItemYawByViewportPosition(0)
    requestAnimationFrame(() => updateItemYawByViewportPosition(0))

    kpisAnimationInitialized = true
}
