// Runs a function through an injected script tag so it executes in Roam's page context.
export const runInPageContext = (method: (...args: any[]) => any, ...args: any[]) => {
    const stringifiedMethod = method.toString()
    const stringifiedArgs = JSON.stringify(args)
    const scriptContent = `
    document.currentScript.innerHTML = JSON.stringify((${stringifiedMethod})(...${stringifiedArgs}));
  `

    const scriptElement = document.createElement('script')
    scriptElement.innerHTML = scriptContent
    document.documentElement.prepend(scriptElement)

    const result = JSON.parse(scriptElement.innerHTML)
    document.documentElement.removeChild(scriptElement)
    return result
}
