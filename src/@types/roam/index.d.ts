interface RoamAlphaAPI {
    data: {
        q(query: string, ...params: any[]): any
        pull(pattern: string, id: number | [string, string]): any
        undo(): Promise<void>
        redo(): Promise<void>
        block: {
            create(params: {
                location: {'parent-uid': string; order: number | 'first' | 'last'}
                block: {
                    uid?: string
                    string: string
                    open?: boolean
                    heading?: number
                    'text-align'?: string
                    'children-view-type'?: string
                    'block-view-type'?: string
                }
            }): Promise<void>
            update(params: {
                block: {
                    uid: string
                    string?: string
                    open?: boolean
                    heading?: number
                    'text-align'?: string
                    'children-view-type'?: string
                    'block-view-type'?: string
                }
            }): Promise<void>
            move(params: {location: {'parent-uid': string; order: number}; block: {uid: string}}): Promise<void>
            delete(params: {block: {uid: string}}): Promise<void>
            reorderBlocks(params: {location: {'parent-uid': string}; blocks: string[]}): Promise<void>
        }
    }

    ui: {
        getFocusedBlock(): {'block-uid': string; 'window-id': string} | null
        setBlockFocusAndSelection(params: {
            location: {'block-uid': string; 'window-id': string}
            selection?: {start: number; end?: number}
        }): void
        mainWindow: {
            focusFirstBlock(): void
            openBlock(params: {block: {uid: string}}): void
            openPage(params: {page: {uid: string}}): void
        }
        rightSidebar: {
            getWindows(): Array<{'window-id'?: string} & Record<string, unknown>>
            addWindow(params: {window: {type: string; 'block-uid': string}}): void
        }
    }

    util: {
        generateUID(): string
        dateToPageTitle(date: Date): string
    }
}

interface Window {
    roamAlphaAPI: RoamAlphaAPI
    RoamToolkitVimPlugin?: {
        onload: (args: {extensionAPI: RoamExtensionAPI}) => Promise<void>
        onunload: () => Promise<void>
    }
}

interface RoamExtensionAPI {
    settings: {
        get(key: string): unknown | Promise<unknown>
        set(key: string, value: unknown): void | Promise<void>
        panel: {
            create(config: {
                tabTitle: string
                settings: {
                    id: string
                    name: string
                    description?: string
                    action: {
                        type: string
                        component?: () => unknown
                        default?: boolean | string
                        items?: string[]
                        placeholder?: string
                        content?: string
                        onChange?:
                            | ((event: {target: {checked: boolean; value: string}}) => void | Promise<void>)
                            | ((value: string) => void | Promise<void>)
                        onClick?: () => void | Promise<void>
                    }
                }[]
            }): void
        }
    }
}
