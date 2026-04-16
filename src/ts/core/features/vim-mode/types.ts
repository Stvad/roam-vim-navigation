export interface Shortcut {
    type: 'shortcut'
    id: string
    label: string
    initValue: string
    modes: string[]
    consumeEvent?: boolean
    onPress: (event: KeyboardEvent) => Promise<any> | undefined
}
