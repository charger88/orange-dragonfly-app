/* eslint-disable no-undef */
const path = require('path')

const Helpers = require('./../src/helpers')

test.each([
  ['TestController', 'test-controller'],
  ['TestControllerTestControllerTestControllerTestController', 'test-controller-test-controller-test-controller-test-controller'],
  ['testController', 'test-controller'],
  ['TTT', 't-t-t'],
  ['T5T', 't-5-t'],
  ['T5', 't-5'],
  ['T', 't']
])('camelCaseToDashCase', (input, expected) => {
  expect(Helpers.camelCaseToDashCase(input)).toBe(expected)
})

test('readDirRecursively', () => {
  const names = Helpers.readDirRecursively(path.join(__dirname, '/data/recursive-dirs'))
  expect(names.length).toBe(4)
  expect(names).toEqual(['a/a1.js', 'a/a2.js', 'a/c/c.js', 'b/b.js'])
})

test('loadClassesFromDirRecursively', () => {
  const classes = Helpers.loadClassesFromDirRecursively(path.join(__dirname, '/data/recursive-dirs'))
  expect(classes.length).toBe(4)
  const names = classes.map(c => c.name).sort()
  expect(names).toEqual(['ClassA1', 'ClassA2', 'ClassB', 'ClassC'])
})
