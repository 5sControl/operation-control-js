require('./globals')
require('./Translation')
require('./Detector')
require('./Control')
require('./Report')

var process = require('process') 
setInterval(() => {
    console.log(`Memory usage: ${Math.floor(process.memoryUsage().rss/1000000)}MB `) 
}, 1000);

dispatcher.emit("container started", { message: `
launch: ${process.env.launch}
camera_url: ${process.env.camera_url}
folder: ${process.env.folder}
server_url: ${process.env.server_url}
algorithm_name: ${process.env.algorithm_name}
link_reports: ${process.env.link_reports}
currentDebugFolder: ${process.env.currentDebugFolder}
N_CPUS: ${process.env.N_CPUS}
socket_server: ${process.env.socket_server}
`
})