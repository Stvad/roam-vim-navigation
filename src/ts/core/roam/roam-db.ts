import {runInPageContext} from '../common/browser'

type RoamPage = {
    uid: string
    name: string
}

export const RoamDb = {
    getBlockById(dbId: number) {
        return runInPageContext((pattern: string, id: number) => window.roamAlphaAPI.pull(pattern, id), '[*]', dbId)
    },

    query(query: string, ...params: any[]) {
        console.log('Executing Roam DB query', query)
        console.log('Query params', params)

        return runInPageContext((q: string, ...p: any[]) => window.roamAlphaAPI.q(q, ...p), query, ...params)
    },

    queryFirst(query: string, ...params: any[]) {
        const results = this.query(query, ...params)
        if (!results?.[0] || results?.[0].lenght < 1) return null

        return this.getBlockById(results[0][0])
    },

    getPageByName(name: string) {
        return this.queryFirst('[:find ?e :in $ ?a :where [?e :node/title ?a]]', name)
    },

    getBlockByUid(uid: string) {
        return this.queryFirst('[:find ?e :in $ ?a :where [?e :block/uid ?a]]', uid)
    },

    updateBlockText(uid: string, newText: string) {
        runInPageContext((params: {block: {uid: string; string: string}}) => window.roamAlphaAPI.updateBlock(params), {
            block: {uid, string: newText},
        })
    },

    getFocusedBlockUid(): string | null {
        return runInPageContext(() => {
            const focused = window.roamAlphaAPI.ui.getFocusedBlock()
            return focused ? focused['block-uid'] : null
        })
    },

    getParentBlockUid(childUid: string): string | null {
        const results = this.query(
            '[:find ?parent-uid :in $ ?child-uid :where [?child :block/uid ?child-uid] [?parent :block/children ?child] [?parent :block/uid ?parent-uid]]',
            childUid
        )
        return results?.[0]?.[0] ?? null
    },

    setBlockOpen(uid: string, open: boolean) {
        runInPageContext((params: {block: {uid: string; open: boolean}}) => window.roamAlphaAPI.updateBlock(params), {
            block: {uid, open},
        })
    },

    focusBlock(uid: string) {
        runInPageContext((blockUid: string) => {
            window.roamAlphaAPI.ui.setBlockFocusAndContext({
                location: {'block-uid': blockUid, 'window-id': 'main-window'},
            })
        }, uid)
    },

    getAllPages(): RoamPage[] {
        return this.query(
            '[:find ?uid ?title :where [?page :node/title ?title] [?page :block/uid ?uid]]'
        ).map(([uid, name]: [string, string]) => ({uid, name}))
    },
}
