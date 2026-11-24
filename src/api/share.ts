import { makeShareLink, shareParams } from '../data/shareLinks'

export function sharedToken(hash: string, name: string) {
  return shareParams(hash).get(`${name}Token`) ?? undefined
}

export function shareUrl(path: string, name: string, token: string) {
  return makeShareLink(path, new URLSearchParams({ [`${name}Token`]: token }))
}
