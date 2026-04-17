import {RoamDate} from 'src/core/roam/date'

describe('RoamDate', () => {
    const date = new Date(2026, 3, 16)

    it('formats daily note page titles through roamAlphaAPI util.dateToPageTitle', () => {
        window.roamAlphaAPI = {
            util: {
                dateToPageTitle: jest.fn(() => 'April 16th, 2026'),
                generateUID: jest.fn(),
            },
        } as unknown as typeof window.roamAlphaAPI

        expect(RoamDate.format(date)).toBe('April 16th, 2026')
        expect(RoamDate.formatPage(date)).toBe('[[April 16th, 2026]]')
        expect(window.roamAlphaAPI.util.dateToPageTitle).toHaveBeenCalledTimes(2)
    })

    it('keeps the separate US date formatting helper for non-Roam output', () => {
        expect(RoamDate.formatUS(date)).toBe('04-16-2026')
    })
})
