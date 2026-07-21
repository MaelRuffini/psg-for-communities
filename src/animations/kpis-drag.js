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
const KPI_INERTIA_LOOKAHEAD_MS = 380
const KPI_INERTIA_MIN_DURATION = 0.45
const KPI_INERTIA_MAX_DURATION = 1.1
const KPI_LOOP_COPIES = 3

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
        const dragDistance = Math.max(
            wrap.clientWidth * KPI_PROGRESS_DRAG_DISTANCE_FACTOR,
            1
        )
        return 1 / dragDistance
    }

    const setTrackPositionByProgress = (value) => {
        const xPercent = gsap.utils.interpolate(100, -100 * items.length, value)
        gsap.set(items, { xPercent })
    }

    const measureLoop = () => {
        setTrackPositionByProgress(0)
        const firstCenterAtStart = getItemCenterX(items[0])
        const cloneCenterAtStart = getItemCenterX(items[originalCount])

        setTrackPositionByProgress(1)
        const firstCenterAtEnd = getItemCenterX(items[0])

        const fullTravel = firstCenterAtEnd - firstCenterAtStart
        const oneSetTravel = cloneCenterAtStart - firstCenterAtStart

        loopSpan =
            Math.abs(fullTravel) < 0.001
                ? originalCount / (items.length + 1)
                : Math.abs(oneSetTravel / fullTravel)

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

    const applyProgress = () => {
        const viewportCenterX = window.innerWidth / 2
        const maxDistance = Math.max(
            viewportCenterX * KPI_VIEWPORT_DISTANCE_MULTIPLIER,
            1
        )
        setTrackPositionByProgress(progress)

        items.forEach((item, index) => {
            const itemCenterX = getItemCenterX(item)
            const normalizedOffset = (itemCenterX - viewportCenterX) / maxDistance
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
            const delta = Math.abs(projectedProgress - progress)
            if (delta < 0.0015) {
                normalizeProgress()
                applyProgress()
                return
            }

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
                        normalizeProgress()
                        // Keep tween value in sync after seamless loop shifts
                        this.targets()[0].value = progress
                        applyProgress()
                    },
                    onComplete: () => {
                        normalizeProgress()
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
