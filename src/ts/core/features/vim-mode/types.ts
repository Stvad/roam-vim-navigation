export interface Shortcut {
    type: 'shortcut'
    id: string
    label: string
    initValue: string
    modes: string[]
    onPress: (event: KeyboardEvent) => Promise<any> | undefined
}
