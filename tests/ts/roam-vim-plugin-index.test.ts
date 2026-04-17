import {subscribeToKeyboardLayoutChanges} from 'src/roam-vim-plugin/index'

describe('subscribeToKeyboardLayoutChanges', () => {
    const originalKeyboard = navigator.keyboard

    afterEach(() => {
        Object.defineProperty(navigator, 'keyboard', {
            configurable: true,
            value: originalKeyboard,
        })
    })

    it('does nothing when keyboard layout change events are unsupported', () => {
        const keyboard = {
            getLayoutMap: jest.fn(),
        }
        Object.defineProperty(navigator, 'keyboard', {
            configurable: true,
            value: keyboard,
        })

        const onLayoutChange = jest.fn()
        const unsubscribe = subscribeToKeyboardLayoutChanges(onLayoutChange)

        expect(() => unsubscribe()).not.toThrow()
        expect(onLayoutChange).not.toHaveBeenCalled()
    })

    it('subscribes via addEventListener when available', () => {
        const addEventListener = jest.fn()
        const removeEventListener = jest.fn()
        Object.defineProperty(navigator, 'keyboard', {
            configurable: true,
            value: {
                addEventListener,
                getLayoutMap: jest.fn(),
                removeEventListener,
            },
        })

        const onLayoutChange = jest.fn()
        const unsubscribe = subscribeToKeyboardLayoutChanges(onLayoutChange)

        expect(addEventListener).toHaveBeenCalledWith('layoutchange', expect.any(Function))
        unsubscribe()
        expect(removeEventListener).toHaveBeenCalledWith('layoutchange', expect.any(Function))
    })

    it('falls back to onlayoutchange when event listeners are unavailable', () => {
        const keyboard: {
            getLayoutMap: jest.Mock
            onlayoutchange?: ((event: Event) => void) | null
        } = {
            getLayoutMap: jest.fn(),
            onlayoutchange: null,
        }
        Object.defineProperty(navigator, 'keyboard', {
            configurable: true,
            value: keyboard,
        })

        const onLayoutChange = jest.fn()
        const unsubscribe = subscribeToKeyboardLayoutChanges(onLayoutChange)

        keyboard.onlayoutchange?.(new Event('layoutchange'))
        expect(onLayoutChange).toHaveBeenCalledTimes(1)

        unsubscribe()
        expect(keyboard.onlayoutchange).toBeNull()
    })
})
