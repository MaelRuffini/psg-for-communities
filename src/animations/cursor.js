import gsap from 'gsap/dist/gsap'

const DESKTOP_QUERY = '(min-width: 992px)'

export function initCursor() {
    const cursor = document.querySelector('.cursor_wrapper')
    const trigger = document.querySelector('.hero_background_scale')

    console.log('[cursor] init', { cursor, trigger })
    if (!cursor || !trigger) {
        console.warn('[cursor] missing element', { cursor, trigger })
        return
    }

    const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches

    gsap.set(cursor, { xPercent: 2, yPercent: 2 })

    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.3, ease: 'power3.out' })
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.3, ease: 'power3.out' })

    const show = () => {
        if (!isDesktop()) return
        cursor.style.display = 'flex'
        cursor.style.opacity = '1'
    }

    const hide = () => {
        cursor.style.opacity = '0'
        cursor.style.display = 'none'
    }

    window.addEventListener('mousemove', (event) => {
        if (!isDesktop()) {
            hide()
            return
        }

        xTo(event.clientX)
        yTo(event.clientY)

        if (trigger.contains(event.target)) show()
        else hide()
    })

    window.matchMedia(DESKTOP_QUERY).addEventListener('change', (event) => {
        if (!event.matches) hide()
    })

    if (isDesktop() && trigger.matches(':hover')) show()
}
    const cursor = document.querySelector('.cursor_wrapper')
    const trigger = document.querySelector('.hero_background_scale')

    console.log('[cursor] init', { cursor, trigger })
    if (!cursor || !trigger) {
        console.warn('[cursor] missing element', { cursor, trigger })
        return
    }

    gsap.set(cursor, { xPercent: 2, yPercent: 2 })

    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.3, ease: 'power3.out' })
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.3, ease: 'power3.out' })

    const show = () => {
        cursor.style.display = 'flex'
        cursor.style.opacity = '1'
    }

    const hide = () => {
        cursor.style.opacity = '0'
        cursor.style.display = 'none'
    }

    window.addEventListener('mousemove', (event) => {
        xTo(event.clientX)
        yTo(event.clientY)

        if (trigger.contains(event.target)) show()
        else hide()
    })

    if (trigger.matches(':hover')) show()
}
