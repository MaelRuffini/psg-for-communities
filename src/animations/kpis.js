import gsap from 'gsap/dist/gsap'
import Draggable from 'gsap/dist/Draggable'

const KPIS_WRAP_SELECTOR = '.kpis_wrap'
const KPIS_TRACK_SELECTOR = '.kpis_cl'
const KPIS_ITEM_SELECTOR = '.kpis_cl_item'
const KPI_IMAGE_SELECTOR = '.kpis_cl_image'
const KPI_MAX_YAW_DEG = 18
const KPI_MOBILE_MAX_YAW_DEG = 10
const KPI_MIN_SCALE = 0.76
const KPI_MAX_SCALE = 1
const KPI_CENTER_DEADZONE = 0.03
const KPI_IMAGE_PARALLAX_MAX_PERCENT = 8
const KPI_VIEWPORT_DISTANCE_MULTIPLIER = 1.7
const KPI_PROGRESS_DRAG_DISTANCE_FACTOR = 1.6
const KPI_INERTIA_LOOKAHEAD_MS = 380
const KPI_INERTIA_MIN_DURATION = 0.45
const KPI_INERTIA_MAX_DURATION = 1.1
const KPI_MOBILE_BREAKPOINT = 768
const MOBILE_VIEWPORT_UI_DELTA_MAX = 140

let kpisAnimationInitialized = false
gsap.registerPlugin(Draggable)

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
        perspective: 900,
        transformStyle: 'preserve-3d'
    })

    gsap.set(wrap, {
        cursor: 'grab',
        touchAction: 'pan-y'
    })

    gsap.set(items, {
        rotationY: 0,
        scale: KPI_MIN_SCALE,
        transformOrigin: '50% 50%',
        transformStyle: 'preserve-3d',
        force3D: true,
        backfaceVisibility: 'hidden',
        willChange: 'transform'
    })

    gsap.set(images.filter(Boolean), {
        xPercent: 0,
        force3D: true,
        backfaceVisibility: 'hidden',
        willChange: 'transform'
    })

    const yawSetters = Array.from(items, (item) =>
        gsap.quickTo(item, 'rotationY', {
            duration: 0.22,
            ease: 'power2.out'
        })
    )

    const imageParallaxSetters = images.map((image) =>
        image
            ? gsap.quickTo(image, 'xPercent', {
                duration: 0.2,
                ease: 'power2.out'
            })
            : null
    )

    let progress = 0
    let throwTween = null
    let minProgress = 0
    let maxProgress = 1
    let previousWidth = window.innerWidth
    let previousHeight = window.innerHeight
    let resizeFrame = null

    const getProgressPerPixel = () => {
        const dragDistance = Math.max(
            wrap.clientWidth * KPI_PROGRESS_DRAG_DISTANCE_FACTOR,
            1
        )
        return 1 / dragDistance
    }

    const getXPercentFromProgress = (value) =>
        gsap.utils.interpolate(100, -100 * items.length, value)

    const applyProgress = () => {
        const isMobileViewport = window.matchMedia(
            `(max-width: ${KPI_MOBILE_BREAKPOINT - 1}px)`
        ).matches
        const maxYaw = isMobileViewport ? KPI_MOBILE_MAX_YAW_DEG : KPI_MAX_YAW_DEG
        const viewportCenterX = window.innerWidth / 2
        const maxDistance = Math.max(
            viewportCenterX * KPI_VIEWPORT_DISTANCE_MULTIPLIER,
            1
        )
        const xPercent = getXPercentFromProgress(progress)

        gsap.set(items, { xPercent })

        items.forEach((item, index) => {
            const rect = item.getBoundingClientRect()
            const itemCenterX = rect.left + rect.width / 2
            const normalizedOffset = (itemCenterX - viewportCenterX) / maxDistance
            const clampedOffset = gsap.utils.clamp(-1, 1, normalizedOffset)
            const centeredFactor = 1 - Math.abs(clampedOffset)
            const isCentered = Math.abs(clampedOffset) <= KPI_CENTER_DEADZONE
            const targetScale = isCentered
                ? 1
                : gsap.utils.interpolate(KPI_MIN_SCALE, KPI_MAX_SCALE, centeredFactor)

            yawSetters[index](clampedOffset * maxYaw)
            gsap.set(item, { scale: targetScale })
            imageParallaxSetters[index]?.(
                -clampedOffset * KPI_IMAGE_PARALLAX_MAX_PERCENT
            )
        })
    }

    const calculateCenteredProgressForItem = (itemIndex, currentProgress = progress) => {
        const viewportCenterX = window.innerWidth / 2
        const item = items[itemIndex]
        if (!item) return null

        const rectAtCurrent = item.getBoundingClientRect()
        const centerAtCurrent = rectAtCurrent.left + rectAtCurrent.width / 2
        const xPercentAtCurrent = getXPercentFromProgress(currentProgress)
        const pixelsPerXPercent = rectAtCurrent.width / 100
        if (Math.abs(pixelsPerXPercent) < 0.001) return null

        const deltaXPercentNeeded =
            (viewportCenterX - centerAtCurrent) / pixelsPerXPercent
        const xPercentCentered = xPercentAtCurrent + deltaXPercentNeeded
        const interpolationDenominator = -100 * (items.length + 1)
        if (Math.abs(interpolationDenominator) < 0.001) return null

        // Inverse of getXPercentFromProgress(): x = 100 + (-100*(n+1))*progress
        return (xPercentCentered - 100) / interpolationDenominator
    }

    const recalculateProgressBounds = () => {
        const previousProgress = progress
        const firstItemCenteredProgress = calculateCenteredProgressForItem(
            0,
            previousProgress
        )
        const lastItemCenteredProgress = calculateCenteredProgressForItem(
            items.length - 1,
            previousProgress
        )

        const hasValidBounds =
            Number.isFinite(firstItemCenteredProgress) &&
            Number.isFinite(lastItemCenteredProgress)

        if (hasValidBounds) {
            minProgress = Math.min(firstItemCenteredProgress, lastItemCenteredProgress)
            maxProgress = Math.max(firstItemCenteredProgress, lastItemCenteredProgress)
        } else {
            minProgress = 0
            maxProgress = 1
        }

        progress = gsap.utils.clamp(minProgress, maxProgress, previousProgress)
    }

    let dragStartProgress = 0
    let dragStartX = 0
    let lastDragX = 0
    let lastDragTime = 0
    let dragVelocityPxPerMs = 0
    const proxy = document.createElement('div')

    Draggable.create(proxy, {
        type: 'x',
        trigger: wrap,
        onPress() {
            throwTween?.kill()
            dragStartProgress = progress
            dragStartX = this.x
            lastDragX = this.x
            lastDragTime = performance.now()
            dragVelocityPxPerMs = 0
            gsap.set(wrap, { cursor: 'grabbing' })
        },
        onRelease() {
            gsap.set(wrap, { cursor: 'grab' })

            const projectedProgress = gsap.utils.clamp(
                minProgress,
                maxProgress,
                progress -
                dragVelocityPxPerMs *
                KPI_INERTIA_LOOKAHEAD_MS *
                getProgressPerPixel()
            )
            const delta = Math.abs(projectedProgress - progress)
            if (delta < 0.0015) return

            const duration = gsap.utils.clamp(
                KPI_INERTIA_MIN_DURATION,
                KPI_INERTIA_MAX_DURATION,
                delta * 2.8
            )

            throwTween = gsap.to(
                { value: progress },
                {
                    value: projectedProgress,
                    duration,
                    ease: 'power3.out',
                    onUpdate: function onUpdate() {
                        progress = this.targets()[0].value
                        applyProgress()
                    }
                }
            )
        },
        onDrag() {
            const now = performance.now()
            const deltaX = this.x - lastDragX
            const deltaTime = Math.max(now - lastDragTime, 1)
            dragVelocityPxPerMs = deltaX / deltaTime
            lastDragX = this.x
            lastDragTime = now
            const dragDeltaFromPress = this.x - dragStartX

            progress = gsap.utils.clamp(
                minProgress,
                maxProgress,
                dragStartProgress - dragDeltaFromPress * getProgressPerPixel()
            )
            applyProgress()
        }
    })

    const handleResize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        const widthDelta = Math.abs(width - previousWidth)
        const heightDelta = Math.abs(height - previousHeight)
        const isMobileViewport = window.matchMedia(
            `(max-width: ${KPI_MOBILE_BREAKPOINT - 1}px)`
        ).matches
        const isLikelyMobileBrowserUiResize =
            isMobileViewport &&
            widthDelta === 0 &&
            heightDelta > 0 &&
            heightDelta <= MOBILE_VIEWPORT_UI_DELTA_MAX

        previousWidth = width
        previousHeight = height
        if (isLikelyMobileBrowserUiResize) return

        recalculateProgressBounds()
        applyProgress()
    }

    window.addEventListener('resize', () => {
        if (resizeFrame) cancelAnimationFrame(resizeFrame)
        resizeFrame = requestAnimationFrame(handleResize)
    })

    recalculateProgressBounds()
    applyProgress()
    requestAnimationFrame(applyProgress)

    kpisAnimationInitialized = true
}
