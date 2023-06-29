// -------------- Paths and dirs
const {accessSync, mkdirSync} = require('fs')
function isExists(dir) {
    try {
        accessSync(dir)
        console.log('Dir exists')
    } catch (err) {
        if (err.code === 'ENOENT') {
            mkdirSync(dir)
            console.log(dir, "created successfully... ")
        }
    }
}
/**
 * @param {string[]} dirs
 * @returns {true | ReferenceError} created folders or not
 */
function checkDirs(dirs) {
    try {
        for (const dir of dirs) {
            isExists(dir)
        }
        return true
    } catch (error) {
        return error
    }
}

module.exports = { isExists, checkDirs }