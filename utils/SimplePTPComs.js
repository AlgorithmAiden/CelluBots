let localPeer = new Peer()
const connections = {}

let onPeerMessageReceived

function setupPeerConnectionEvents(conn) {
    conn.on('data', data => {
        if (typeof onPeerMessageReceived === 'function') {
            onPeerMessageReceived(data)
        }
    })
    conn.on('open', () => {
        connections[conn.peer] = conn
    })
    conn.on('close', () => {
        delete connections[conn.peer]
    })
}
export default {
    host: {
        getSelfId() {
            return localPeer.id
        },
        sendMessage(peerId, message) {
            if (connections[peerId] && connections[peerId].open) {
                connections[peerId].send(message)
            } else {
                console.log(`Connection with ${peerId} is not established or is closed.`)
            }
        },
        setOnMessage(callback) {
            localPeer.on('connection', incomingConnection => {
                connections[incomingConnection.peer] = incomingConnection
                incomingConnection.on('data', data => {
                    callback(incomingConnection.peer, data)
                })
            })
        }
    },
    remote: {
        connect(hostId) {
            const conn = localPeer.connect(hostId)
            setupPeerConnectionEvents(conn)
        },
        sendMessage(message) {
            Object.values(connections).forEach(conn => {
                if (conn.open) {
                    conn.send(message)
                }
            })
        },

        setOnMessage(callback) {
            onPeerMessageReceived = callback
            // localPeer.on('connection', incomingConnection => {
            //     setupPeerConnectionEvents(incomingConnection)

            //     // Setting up a listener for incoming data on the connection
            //     incomingConnection.on('data', data => {
            //         // Execute the callback with the data received
            //         callback(data)
            //     })
            // })
        }
    }
}