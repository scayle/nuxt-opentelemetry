import type { H3Event } from 'h3'

export function getReplace(pathReplace?: string[]): (path: string) => string {
  if (!pathReplace || pathReplace.length !== 2) {
    return (path: string) => path
  }

  try {
    const regex = new RegExp(pathReplace[0])
    return (path: string) => path.replace(regex, pathReplace[1])
  } catch {
    return (path: string) => path.replace(pathReplace[0], pathReplace[1])
  }
}

export function getFilter(pathBlocklist?: string): (path: string) => boolean {
  if (!pathBlocklist) {
    return (_path: string) => false
  }

  try {
    const regex = new RegExp(pathBlocklist)
    return (path: string) => regex.test(path)
  } catch {
    return (path: string) => path.includes(pathBlocklist)
  }
}

export function getRouteName(
  event: H3Event,
  replace: (path: string) => string,
): string | undefined {
  const matchedRoute = event.context.matchedVueRoute?.[event.path]?.path ??
    event.context.matchedRoute?.path ?? event.path

  if (matchedRoute) {
    return replace(matchedRoute)
  }

  return undefined
}
