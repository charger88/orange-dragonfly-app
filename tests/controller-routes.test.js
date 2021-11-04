/* eslint-disable no-undef */

const OrangeDragonflyController = require('./../src/controller.js')

test('basic methods', () => {
  const controller = class TestController1 extends OrangeDragonflyController {
    doGet () {}
    doPost () {}
    doGetId () {}
    doPatch () {}
    doPutId () {}
  }
  const routes = controller.routes
  expect(routes).toEqual([
    { method: 'get', path: '/test-controller-1', action: 'doGet' },
    { method: 'get', path: '/test-controller-1/{#id}', action: 'doGetId' },
    { method: 'patch', path: '/test-controller-1', action: 'doPatch' },
    { method: 'post', path: '/test-controller-1', action: 'doPost' },
    { method: 'put', path: '/test-controller-1/{#id}', action: 'doPutId' }
  ])
})

test('no methods found', () => {
  const tmp = console.warn
  let x = null
  console.warn = m => {
    x = m
  }
  const controller = class TestController2 extends OrangeDragonflyController {
    doTest () {}
  }
  const routes = controller.routes
  expect(routes).toEqual([])
  expect(x).toBe('There is no routes found in controller TestController2')
  console.warn = tmp
})

test('root path', () => {
  const controller = class TestController3 extends OrangeDragonflyController {
    static get path () {
      return '/'
    }

    doGet () {}
    doGetId () {}
  }
  const routes = controller.routes
  expect(routes).toEqual([
    { method: 'get', path: '/', action: 'doGet' },
    { method: 'get', path: '/{#id}', action: 'doGetId' }
  ])
})

test('string path', () => {
  const controller = class TestController6 extends OrangeDragonflyController {
    static get path () {
      return '/test'
    }

    doGet () {}
    doGetId () {}
  }
  const routes = controller.routes
  expect(routes).toEqual([
    { method: 'get', path: '/test', action: 'doGet' },
    { method: 'get', path: '/test/{#id}', action: 'doGetId' }
  ])
})

test('id parameter', () => {
  const controller = class TestController4 extends OrangeDragonflyController {
    static get idParameterName () {
      return 'uuid'
    }

    doGet () {}
    doGetId () {}
  }
  const routes = controller.routes
  expect(routes).toEqual([
    { method: 'get', path: '/test-controller-4', action: 'doGet' },
    { method: 'get', path: '/test-controller-4/{uuid}', action: 'doGetId' }
  ])
})

test('extra methods', () => {
  const controller = class TestController5 extends OrangeDragonflyController {
    doGet () {}
    doGetId () {}
    doGetTests () {}
    doGetIdSubTest5 () {}
  }
  const routes = controller.routes
  expect(routes).toEqual([
    { method: 'get', path: '/test-controller-5', action: 'doGet' },
    { method: 'get', path: '/test-controller-5/{#id}', action: 'doGetId' },
    { method: 'get', path: '/test-controller-5/{#id}/sub-test-5', action: 'doGetIdSubTest5' },
    { method: 'get', path: '/test-controller-5/tests', action: 'doGetTests' }
  ])
})
