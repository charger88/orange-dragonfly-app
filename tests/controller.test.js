/* eslint-disable no-undef */

const OrangeDragonflyController = require('../src/controller.js')

describe('Get/Set variable', () => {
  const c1 = new OrangeDragonflyController()
  test('it works', () => {
    c1.setVar('k1', 'v1')
    c1.setVar('k2', 'v2')
    expect(c1.getVar('k1')).toBe('v1')
    expect(c1.getVar('k2')).toBe('v2')
    c1.setVar('k2', 'v2new')
    expect(c1.getVar('k2')).toBe('v2new')
  })
  test('not found', () => {
    expect(() => c1.getVar('v3')).toThrow(Error)
  })
})
