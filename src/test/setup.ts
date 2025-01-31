import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extende os matchers do jest-dom
expect.extend(matchers as any)

// Limpa após cada teste
afterEach(() => {
  cleanup()
})

// Define as funções globais
global.expect = expect
global.vi = vi 