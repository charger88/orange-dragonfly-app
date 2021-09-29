const fs = require('fs')

/**
 * Transforms camel case string into dash-case string
 * @param {string} s (like "TestString")
 * @return {string} (like "test-string")
 */
const camelCaseToDashCase = s => {
  return s.split('').reduce((path, c) => `${path}${path.length > 0 && /[A-Z0-9]/.test(c) ? `-${c.toLowerCase()}` : c.toLowerCase()}`, '')
}

/**
 * Recursively reads directory
 * @param {string} dirPath
 * @param {boolean} keepDirPath
 * @return {string[]}
 */
const readDirRecursively = (dirPath, keepDirPath = false) => {
  const paths = []
  const readDir = p => {
    const files = fs.readdirSync(p).map(f => `${p}/${f}`)
    for (const file of files) {
      if (fs.statSync(file).isDirectory()) {
        readDir(file)
      } else {
        paths.push(file)
      }
    }
  }
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    readDir(dirPath)
  } else {
    console.warn(`Directory ${dirPath} not found`)
  }
  return keepDirPath ? paths : paths.map(v => v.slice(dirPath.length + (v[dirPath.length] === '/' ? 1 : 0)))
}

/**
 * Recursively reads directory and imports their content
 * @param {string} dirPath
 * @return {Array}
 */
const loadClassesFromDirRecursively = dirPath => {
  return readDirRecursively(dirPath, true)
    .filter(f => f.endsWith('.js'))
    .map(f => require(f))
}

module.exports = {
  camelCaseToDashCase,
  readDirRecursively,
  loadClassesFromDirRecursively
}
