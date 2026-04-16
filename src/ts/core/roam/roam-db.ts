type RoamPage = {
    uid: string
    name: string
}

export type RoamBlockLocation = {
    'block-uid': string
    'window-id': string
}

type BlockOrder = number | 'first' | 'last'

type BlockUpdate = {
    string?: string
    open?: boolean
    heading?: number
    'text-align'?: string
    'children-view-type'?: string
    'block-view-type'?: string
}

const blockEntityId = (uid: string): [string, string] => [':block/uid', uid]

export const RoamDb = {
    getBlockById(dbId: number, pattern: string = '[*]') {
        return window.roamAlphaAPI.data.pull(pattern, dbId)
    },

    query(query: string, ...params: any[]) {
        return window.roamAlphaAPI.data.q(query, ...params)
    },

    queryFirst(query: string, ...params: any[]) {
        const results = this.query(query, ...params)
        if (!results?.[0] || results?.[0].length < 1) return null

        return this.getBlockById(results[0][0])
    },

    getPageByName(name: string) {
        return this.queryFirst('[:find ?e :in $ ?a :where [?e :node/title ?a]]', name)
    },

    getBlockByUid(uid: string, pattern: string = '[*]') {
        return window.roamAlphaAPI.data.pull(pattern, blockEntityId(uid))
    },

    getBlockOrder(uid: string): number | null {
        return this.query(
            '[:find ?order . :in $ ?uid :where [?block :block/uid ?uid] [?block :block/order ?order]]',
            uid
        )
    },

    updateBlock(uid: string, block: BlockUpdate) {
        return window.roamAlphaAPI.data.block.update({block: {uid, ...block}})
    },

    updateBlockText(uid: string, newText: string) {
        return this.updateBlock(uid, {string: newText})
    },

    createBlock(params: {location: {parentUid: string; order: BlockOrder}; block: {uid?: string; string: string}}) {
        return window.roamAlphaAPI.data.block.create({
            location: {'parent-uid': params.location.parentUid, order: params.location.order},
            block: params.block,
        })
    },

    moveBlock(params: {uid: string; parentUid: string; order: number}) {
        return window.roamAlphaAPI.data.block.move({
            location: {'parent-uid': params.parentUid, order: params.order},
            block: {uid: params.uid},
        })
    },

    deleteBlock(uid: string) {
        return window.roamAlphaAPI.data.block.delete({block: {uid}})
    },

    getFocusedBlock(): RoamBlockLocation | null {
        return window.roamAlphaAPI.ui.getFocusedBlock()
    },

    getFocusedBlockUid(): string | null {
        return this.getFocusedBlock()?.['block-uid'] ?? null
    },

    getParentBlockUid(childUid: string): string | null {
        return this.query(
            '[:find ?parent-uid . :in $ ?child-uid :where [?child :block/uid ?child-uid] [?parent :block/children ?child] [?parent :block/uid ?parent-uid]]',
            childUid
        )
    },

    getChildBlockUids(parentUid: string): string[] {
        const children = this.query(
            '[:find ?child-uid ?order :in $ ?parent-uid :where [?parent :block/uid ?parent-uid] [?parent :block/children ?child] [?child :block/uid ?child-uid] [?child :block/order ?order]]',
            parentUid
        ) as [string, number][]

        return children.sort((left, right) => left[1] - right[1]).map(([uid]) => uid)
    },

    setBlockOpen(uid: string, open: boolean) {
        return this.updateBlock(uid, {open})
    },

    focusBlock(location: RoamBlockLocation, selection?: {start: number; end?: number}) {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection(selection ? {location, selection} : {location})
    },

    focusBlockUid(uid: string, windowId: string = 'main-window', selection?: {start: number; end?: number}) {
        this.focusBlock({'block-uid': uid, 'window-id': windowId}, selection)
    },

    undo() {
        return window.roamAlphaAPI.data.undo()
    },

    redo() {
        return window.roamAlphaAPI.data.redo()
    },

    getAllPages(): RoamPage[] {
        return this.query(
            '[:find ?uid ?title :where [?page :node/title ?title] [?page :block/uid ?uid]]'
        ).map(([uid, name]: [string, string]) => ({uid, name}))
    },
}
