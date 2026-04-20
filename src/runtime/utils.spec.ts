import { describe, it, expect } from 'vitest'
import { getFilter, getReplace } from './utils'

describe('instrumentation setup utils', () => {
  describe('getFilter', () => {
    it('basic filter', () => {
      const filter = getFilter('hello')
      expect(filter('/en/hello')).toBe(true)
      expect(filter('/en/goodbye')).toBe(false)
    })

    it('regex filter', () => {
      const filter = getFilter('.ell')
      expect(filter('/en/hello')).toBe(true)
      expect(filter('/en/goodbye')).toBe(false)
    })

    it('non-regex filter', () => {
      const filter = getFilter('hello_:)')
      expect(filter('/en/hello_:)')).toBe(true)
      expect(filter('/en/hello')).toBe(false)
      expect(filter('/en/goodbye')).toBe(false)
    })

    it('empty filter', () => {
      const filter = getFilter()
      expect(filter('/en/hello')).toBe(false)
      expect(filter('/en/goodbye')).toBe(false)
    })
  })

  describe('getReplace', () => {
    it('basic replace', () => {
      const replace = getReplace(['hello', 'goodbye'])
      expect(replace('/en/hello')).toEqual('/en/goodbye')
    })

    it('regex replace', () => {
      const replace = getReplace(['^/(de|en)/', '/:locale/'])
      expect(replace('/en/hello')).toEqual('/:locale/hello')
    })

    it('empty replace', () => {
      expect(getReplace([])('/en/hello')).toEqual('/en/hello')
      expect(getReplace()('/en/hello')).toEqual('/en/hello')
    })
  })
})
