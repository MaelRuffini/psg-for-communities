import gsap from 'gsap/dist/gsap'
import Draggable from 'gsap/dist/Draggable'

const KPIS_WRAP_SELECTOR = '.kpis_wrap'
const KPIS_TRACK_SELECTOR = '.kpis_cl'
const KPIS_ITEM_SELECTOR = '.kpis_cl_item'
const KPI_IMAGE_SELECTOR = '.kpis_cl_image'
const KPI_MAX_YAW_DEG = 18
const KPI_MIN_SCALE = 0.76
const KPI_MAX_SCALE = 1
const KPI_CENTER_DEADZONE = 0.03
const KPI_IMAGE_PARALLAX_MAX_PERCENT = 8
const KPI_VIEWPORT_DISTANCE_MULTIPLIER = 1.7
const KPI_PROGRESS_DRAG_DISTANCE_FACTOR = 2.8
const KPI_PROGRESS_DRAG_DISTANCE_FACTOR_MOBILE = 4.8
const KPI_MOBILE_BREAKPOINT = 480
const KPI_MOBILE_QUERY = `(max-width: ${KPI_MOBILE_BREAKPOINT - 1}px)`
const KPI_INERTIA_LOOKAHEAD_MS = 160
const KPI_INERTIA_MIN_DURATION = 0.12
const KPI_INERTIA_MAX_DURATION = 0.28
const KPI_SNAP_MIN_DURATION = 0.35
const KPI_SNAP_MAX_DURATION = 0.55
const KPI_LOOP_COPIES = 3
const KPIS_SLIDER_WRAP_SELECTOR = '.kpis_cl_wrap'
const KPI_PAGINATION_CLASS = 'kpis_pagination'
const KPI_PAGINATION_DOT_CLASS = 'kpis_pagination_dot'
const KPI_PAGINATION_ACTIVE_CLASS = 'is--active'

let kpisDragAnimationInitialized = false
gsap.registerPlugin(Draggable)

export function initKpisDragAnimation(scope = document) {
    if (kpisDragAnimationInitialized) return

    const wrap = scope.querySelector(KPIS_WRAP_SELECTOR)
    if (!wrap) return

    const track = wrap.querySelector(KPIS_TRACK_SELECTOR)
    if (!track) return

    const originalItems = Array.from(track.querySelectorAll(KPIS_ITEM_SELECTOR))
    if (!originalItems.length) return

    const originalCount = originalItems.length

    for (let copy = 1; copy < KPI_LOOP_COPIES; copy += 1) {
        originalItems.forEach((item) => {
            track.appendChild(item.cloneNode(true))
        })
    }

    const items = Array.from(track.querySelectorAll(KPIS_ITEM_SELECTOR))
    const images = items.map((item) => item.querySelector(KPI_IMAGE_SELECTOR))

    const pagination = document.createElement('div')
    pagination.className = KPI_PAGINATION_CLASS

    const dots = Array.from({ length: originalCount }, (_, index) => {
        const dot = document.createElement('div')
        dot.className = KPI_PAGINATION_DOT_CLASS
        dot.setAttribute('role', 'button')
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`)
        dot.tabIndex = 0
        pagination.appendChild(dot)
        return dot
    })

    const sliderWrap = wrap.querySelector(KPIS_SLIDER_WRAP_SELECTOR) || track
    sliderWrap.insertAdjacentElement('afterend', pagination)

    let activeDotIndex = -1

    const updatePagination = (activeIndex) => {
        if (activeIndex === activeDotIndex) return
        activeDotIndex = activeIndex
        dots.forEach((dot, index) => {
            const isActive = index === activeIndex
            dot.classList.toggle(KPI_PAGINATION_ACTIVE_CLASS, isActive)
            dot.setAttribute('aria-current', isActive ? 'true' : 'false')
        })
    }

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
        willChange: 'transform'
    })

    gsap.set(images.filter(Boolean), {
        xPercent: 0,
        force3D: true,
        willChange: 'transform'
    })

    const yawSetters = items.map((item) =>
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
    let loopSpan = originalCount / (items.length + 1)
    let loopStart = loopSpan
    let loopEnd = loopSpan * 2
    let fullTravelPx = -1
    let throwTween = null
    let dragStartProgress = 0
    let dragStartX = 0
    let lastDragX = 0
    let lastDragTime = 0
    let dragVelocityPxPerMs = 0

    const getItemCenterX = (item) => {
        const rect = item.getBoundingClientRect()
        return rect.left + rect.width / 2
    }

    const getProgressPerPixel = () => {
        const isMobile = window.matchMedia(KPI_MOBILE_QUERY).matches
        const dragDistanceFactor = isMobile
            ? KPI_PROGRESS_DRAG_DISTANCE_FACTOR_MOBILE
            : KPI_PROGRESS_DRAG_DISTANCE_FACTOR
        const dragDistance = Math.max(wrap.clientWidth * dragDistanceFactor, 1)
        return 1 / dragDistance
    }

    const setTrackPositionByProgress = (value) => {
        const xPercent = gsap.utils.interpolate(100, -100 * items.length, value)
        gsap.set(items, { xPercent })
    }

    const wrapToLoop = (value) => {
        let next = value
        while (next >= loopEnd) next -= loopSpan
        while (next < loopStart) next += loopSpan
        return next
    }

    const measureLoop = () => {
        setTrackPositionByProgress(0)
        const firstCenterAtStart = getItemCenterX(items[0])
        const cloneCenterAtStart = getItemCenterX(items[originalCount])

        setTrackPositionByProgress(1)
        const firstCenterAtEnd = getItemCenterX(items[0])

        fullTravelPx = firstCenterAtEnd - firstCenterAtStart
        const oneSetTravel = cloneCenterAtStart - firstCenterAtStart

        loopSpan =
            Math.abs(fullTravelPx) < 0.001
                ? originalCount / (items.length + 1)
                : Math.abs(oneSetTravel / fullTravelPx)

        // Keep the playhead inside the middle copy so there is always
        // a previous set on the left and a next set on the right.
        loopStart = loopSpan
        loopEnd = loopSpan * 2
    }

    const getCenteredProgressForItem = (item) => {
        const viewportCenterX = window.innerWidth / 2
        setTrackPositionByProgress(0)
        const centerAtStart = getItemCenterX(item)
        setTrackPositionByProgress(1)
        const centerAtEnd = getItemCenterX(item)
        const travel = centerAtEnd - centerAtStart
        if (Math.abs(travel) < 0.001) return loopStart
        return (viewportCenterX - centerAtStart) / travel
    }

    const normalizeProgress = (syncDragStart = false) => {
        let shift = 0
        while (progress >= loopEnd) {
            progress -= loopSpan
            shift -= 1
        }
        while (progress < loopStart) {
            progress += loopSpan
            shift += 1
        }
        if (syncDragStart && shift !== 0) {
            dragStartProgress += shift * loopSpan
        }
    }

    const getSnapProgress = () => {
        if (Math.abs(fullTravelPx) < 0.001) return progress

        const viewportCenterX = window.innerWidth / 2
        let closestOffset = 0
        let closestDist = Infinity

        items.forEach((item) => {
            const offset = getItemCenterX(item) - viewportCenterX
            const dist = Math.abs(offset)
            if (dist < closestDist) {
                closestDist = dist
                closestOffset = offset
            }
        })

        const rawTarget = progress - closestOffset / fullTravelPx
        const wrappedTarget = wrapToLoop(rawTarget)
        const candidates = [
            wrappedTarget,
            wrappedTarget - loopSpan,
            wrappedTarget + loopSpan
        ]

        let bestTarget = wrappedTarget
        let bestDist = Math.abs(wrappedTarget - progress)
        candidates.forEach((candidate) => {
            const dist = Math.abs(candidate - progress)
            if (dist < bestDist) {
                bestDist = dist
                bestTarget = candidate
            }
        })

        return bestTarget
    }

    const getProgressForIndex = (targetIndex) => {
        if (Math.abs(fullTravelPx) < 0.001) return progress

        const viewportCenterX = window.innerWidth / 2
        let closestOffset = 0
        let closestDist = Infinity

        items.forEach((item, index) => {
            if (index % originalCount !== targetIndex) return
            const offset = getItemCenterX(item) - viewportCenterX
            const dist = Math.abs(offset)
            if (dist < closestDist) {
                closestDist = dist
                closestOffset = offset
            }
        })

        if (!Number.isFinite(closestDist) || closestDist === Infinity) {
            return progress
        }

        const rawTarget = progress - closestOffset / fullTravelPx
        const wrappedTarget = wrapToLoop(rawTarget)
        const candidates = [
            wrappedTarget,
            wrappedTarget - loopSpan,
            wrappedTarget + loopSpan
        ]

        let bestTarget = wrappedTarget
        let bestDist = Math.abs(wrappedTarget - progress)
        candidates.forEach((candidate) => {
            const dist = Math.abs(candidate - progress)
            if (dist < bestDist) {
                bestDist = dist
                bestTarget = candidate
            }
        })

        return bestTarget
    }

    const animateProgressTo = (target, duration, ease, onComplete) => {
        throwTween?.kill()
        const delta = Math.abs(target - progress)
        if (delta < 0.0008) {
            progress = wrapToLoop(target)
            applyProgress()
            onComplete?.()
            return
        }

        throwTween = gsap.to(
            { value: progress },
            {
                value: target,
                duration,
                ease,
                onUpdate: function onUpdate() {
                    progress = this.targets()[0].value
                    normalizeProgress()
                    this.targets()[0].value = progress
                    applyProgress()
                },
                onComplete: () => {
                    normalizeProgress()
                    applyProgress()
                    onComplete?.()
                }
            }
        )
    }

    const snapToClosestItem = () => {
        const snapTarget = getSnapProgress()
        const delta = Math.abs(snapTarget - progress)
        if (delta < 0.0008) {
            normalizeProgress()
            applyProgress()
            return
        }

        const duration = gsap.utils.clamp(
            KPI_SNAP_MIN_DURATION,
            KPI_SNAP_MAX_DURATION,
            delta * 3.2
        )
        animateProgressTo(snapTarget, duration, 'power3.out')
    }

    const goToIndex = (targetIndex) => {
        if (targetIndex === activeDotIndex) return

        throwTween?.kill()
        normalizeProgress()

        const target = getProgressForIndex(targetIndex)
        const delta = Math.abs(target - progress)
        if (delta < 0.0008) {
            normalizeProgress()
            applyProgress()
            return
        }

        const duration = gsap.utils.clamp(
            KPI_SNAP_MIN_DURATION,
            KPI_SNAP_MAX_DURATION,
            delta * 3.2
        )
        animateProgressTo(target, duration, 'power3.out')
    }

    dots.forEach((dot, index) => {
        const activate = (event) => {
            event.preventDefault()
            goToIndex(index)
        }

        dot.addEventListener('click', activate)
        dot.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            activate(event)
        })
    })

    const applyProgress = () => {
        const viewportCenterX = window.innerWidth / 2
        const maxDistance = Math.max(
            viewportCenterX * KPI_VIEWPORT_DISTANCE_MULTIPLIER,
            1
        )
        setTrackPositionByProgress(progress)

        let closestIndex = 0
        let closestDist = Infinity

        items.forEach((item, index) => {
            const itemCenterX = getItemCenterX(item)
            const offsetPx = itemCenterX - viewportCenterX
            const dist = Math.abs(offsetPx)
            if (dist < closestDist) {
                closestDist = dist
                closestIndex = index
            }

            const normalizedOffset = offsetPx / maxDistance
            const clampedOffset = gsap.utils.clamp(-1, 1, normalizedOffset)
            const centeredFactor = 1 - Math.abs(clampedOffset)
            const isCentered = Math.abs(clampedOffset) <= KPI_CENTER_DEADZONE
            const targetScale = isCentered
                ? 1
                : gsap.utils.interpolate(KPI_MIN_SCALE, KPI_MAX_SCALE, centeredFactor)

            yawSetters[index](clampedOffset * KPI_MAX_YAW_DEG)
            gsap.set(item, { scale: targetScale })
            imageParallaxSetters[index]?.(
                -clampedOffset * KPI_IMAGE_PARALLAX_MAX_PERCENT
            )
        })

        updatePagination(closestIndex % originalCount)
    }

    const proxy = document.createElement('div')

    Draggable.create(proxy, {
        type: 'x',
        trigger: wrap,
        onPress() {
            throwTween?.kill()
            normalizeProgress()
            dragStartProgress = progress
            dragStartX = this.x
            lastDragX = this.x
            lastDragTime = performance.now()
            dragVelocityPxPerMs = 0
            gsap.set(wrap, { cursor: 'grabbing' })
        },
        onRelease() {
            gsap.set(wrap, { cursor: 'grab' })

            const projectedProgress =
                progress -
                dragVelocityPxPerMs *
                KPI_INERTIA_LOOKAHEAD_MS *
                getProgressPerPixel()
            const inertiaDelta = Math.abs(projectedProgress - progress)

            if (inertiaDelta < 0.001) {
                snapToClosestItem()
                return
            }

            const inertiaDuration = gsap.utils.clamp(
                KPI_INERTIA_MIN_DURATION,
                KPI_INERTIA_MAX_DURATION,
                inertiaDelta * 1.6
            )

            animateProgressTo(
                projectedProgress,
                inertiaDuration,
                'power2.out',
                snapToClosestItem
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

            progress =
                dragStartProgress - dragDeltaFromPress * getProgressPerPixel()
            normalizeProgress(true)
            applyProgress()
        }
    })

    const handleResize = () => {
        const previousProgress = progress
        measureLoop()
        progress = previousProgress
        normalizeProgress()
        applyProgress()
    }
    window.addEventListener('resize', handleResize)

    measureLoop()
    // Center the first slide (middle-copy clone) on load
    progress = getCenteredProgressForItem(items[originalCount])
    normalizeProgress()
    applyProgress()
    requestAnimationFrame(applyProgress)

    kpisDragAnimationInitialized = true
}
