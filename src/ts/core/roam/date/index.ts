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

const formatRoamDate = (date: Date) => {
    const month = monthNames[date.getMonth()]
    const day = date.getDate()
    return `${month} ${day}${getOrdinalSuffix(day)}, ${date.getFullYear()}`
}

const formatUSDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}-${day}-${date.getFullYear()}`
}

export const RoamDate = {
    formatString: `mmmm dS, yyyy`,
    pageFormatString() {
        return `'[['${this.formatString}']]'`
    },
    regex: /\[\[(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(st|nd|th|rd), \d{4}]]/gm,

    formatPage(date: Date) {
        return `[[${formatRoamDate(date)}]]`
    },
    format(date: Date) {
        return formatRoamDate(date)
    },
    formatUS(date: Date) {
        return formatUSDate(date)
    },
    parse(name: string): Date {
        return new Date(name.replace(/(th,|nd,|rd,|st,)/, ','))
    },
    parseFromReference(name: string): Date {
        return this.parse(name.slice(2).slice(0, -2))
    },
}
