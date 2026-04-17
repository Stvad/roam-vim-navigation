type KeyboardLayoutMap = ReadonlyMap<string, string>

interface Keyboard extends EventTarget {
    getLayoutMap(): Promise<KeyboardLayoutMap>
    addEventListener(
        type: 'layoutchange',
        listener: (this: Keyboard, ev: Event) => any,
        options?: boolean | AddEventListenerOptions,
    ): void
    removeEventListener(
        type: 'layoutchange',
        listener: (this: Keyboard, ev: Event) => any,
        options?: boolean | EventListenerOptions,
    ): void
}

interface Navigator {
    keyboard?: Keyboard
}
