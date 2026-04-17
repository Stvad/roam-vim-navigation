beforeEach(() => {
    window.roamAlphaAPI = {
        util: {
            dateToPageTitle: jest.fn(() => 'January 1st, 2020'),
            generateUID: jest.fn(() => 'generated-uid'),
        },
    } as unknown as typeof window.roamAlphaAPI
})
