// This is the official way to mock fs in vitest
// https://vitest.dev/guide/mocking.html#file-system

import { fs } from 'memfs'

module.exports = fs
