const fs = require('fs')
const {YMD} = require('./utils/Date')

function Timestamp() {
	const date = new Date()
	const padTo2Digits = (num) => num.toString().padStart(2, '0')
	return (
		[
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
		].join('-')
            + ' ' +
		[
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds())
		].join(':')
		+ '.' +
		date.getMilliseconds()
	)
}

function EventRecord(eventName, payload) {
    return `${Timestamp()}: ${eventName}${payload ? `\n${payload}` : "" }`
}

function logger(eventName, payload = "") {
    const record = EventRecord(eventName, payload)
    console.log(`\x1b[34m%s\x1b[0m`, record)
    return eventName
}

module.exports = {logger}