const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) {
        return 'th'
    }

    switch (day % 10) {
        case 1:
            return 'st'
        case 2:
            return 'nd'
        case 3:
            return 'rd'
        default:
            return 'th'
    }
}

const dateToPageTitle = (date: Date) => {
    const month = monthNames[date.getMonth()]
    const day = date.getDate()
    return `${month} ${day}${getOrdinalSuffix(day)}, ${date.getFullYear()}`
}

beforeEach(() => {
    window.roamAlphaAPI = {
        util: {
            dateToPageTitle: jest.fn(dateToPageTitle),
            generateUID: jest.fn(() => 'generated-uid'),
        },
    } as unknown as typeof window.roamAlphaAPI
})
