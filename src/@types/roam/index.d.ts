interface RoamAlphaAPI {
    q(query: string, ...params: any[]): any[][]
    pull(pattern: string, id: number | [string, string]): Record<string, any>
    updateBlock(params: {block: {uid: string; string?: string; open?: boolean}}): void
    createBlock(params: {location: {parentUid: string; order: number}; block: {string: string}}): void
    deleteBlock(params: {block: {uid: string}}): void
    moveBlock(params: {location: {parentUid: string; order: number}; block: {uid: string}}): void

    ui: {
        getFocusedBlock(): {'block-uid': string} | null
        setBlockFocusAndContext(params: {location: {'block-uid': string; 'window-id': string}}): void
        mainWindow: {
            openBlock(params: {block: {uid: string}}): void
            openPage(params: {page: {uid: string}}): void
        }
        rightSidebar: {
            addWindow(params: {window: {type: string; 'block-uid': string}}): void
        }
    }
}

interface Window {
    roamAlphaAPI: RoamAlphaAPI
}
