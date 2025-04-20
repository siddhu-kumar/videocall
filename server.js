
const https = require("node:https")
const express = require("express")
const fs = require("node:fs")
const app = express()
const socketIO = require("socket.io")
const path = require('node:path')
app.use(express.static(__dirname))

// const key = fs.readFileSync('cert.key')
// const cert = fs.readFileSync('cert.crt')

// const key = fs.readFileSync(path.join(__dirname, 'localhost-key.pem'))
// const cert = fs.readFileSync(path.join(__dirname,'localhost.pem'))

// const expressServer = https.createServer({key : key, cert : cert},app)

// offers will contain {}
const offers = [
    // offererUserName,
    // offer,
    // offerIceCandidates,
    // answererUserName "client2",
    // answer,
    // answererIceCertificate
]

const connectedSockets = [
    // userName, socketID
]

const io = socketIO(expressServer);
io.on('connection',(socket)=> {
    // console.log("Someone has connected.")

    const userName = socket.handshake.auth.userName;
    const password = socket.handshake.auth.password;

    connectedSockets.push({
        socketId: socket.id,
        userName,
    })

    if(offers.length) {
        socket.emit('availableOffers',offers)
    }

    socket.on('newOffer', (newOffer) => {
        offers.push({
            offererUserName: userName,
            offer: newOffer,
            offerIceCandidates: [],
            answererUserName: null,
            answer: null,
            answererIceCertificate: [],
        })
        console.log(newOffer.sdp.slice(50))
        // send to all connected sockets except sender
        socket.broadcast.emit('newOfferAwaiting', offers.slice(-1))
    })

    socket.on('newAnswer', (offerObj, callback)=> {
        console.log(offerObj)
        const socketToAnswer = connectedSockets.find(s => s.userName === offerObj.offererUserName)
        if(!socketToAnswer) {
            console.log("no matching socket")
            return
        }
        const socketIdToAnswer = socketToAnswer.socketId;
        const offerToUpdate = offers.find(el=>el.offererUserName === offerObj.offererUserName)
        if(!offerToUpdate) {
            console.log("no offer to update")
            return;
        }
        callback(offerToUpdate.offerIceCandidates)

        offerToUpdate.answer = offerObj.answer
        offerToUpdate.answererUserName = userName
        
        socket.to(socketIdToAnswer).emit('answerResponse',offerToUpdate)
    })

    socket.on("sendIceCandidateToSignalingServer", (iceCandidateObj)=> {
        const {didIOffer, iceUserName, iceCandidate} = iceCandidateObj;
        console.log(iceCandidate)

        if(didIOffer) {
            const offerInOffers = offers.find(obj => obj.offererUserName === iceUserName) 
            if(offerInOffers) {
                offerInOffers.offerIceCandidates.push(iceCandidate)
                if(offerInOffers.answererUserName){
                    const socketToSendTo = connectedSockets.find(s=>s.userName === offerInOffers.answererUserName) 
                    if(socketToSendTo) {
                        socket.to(socketToSendTo.socketId).emit('receivedIceCandidatesFromServer', iceCandidate)
                    } else {
                        console.log("Ice candidate received, not answerer found")
                    }
                }
            }
        } else {
            const offerInOffers = offers.find(obj => obj.answererUserName === iceUserName) 
            const socketToSendTo = connectedSockets.find(s=>s.userName === offerInOffers.offererUserName) 
            if(socketToSendTo) {
                socket.to(socketToSendTo.socketId).emit('receivedIceCandidatesFromServer', iceCandidate)
            } else {
                console.log("Ice candidate received, no offerer found")
            }
        }
        console.log(offers)

    })
})

expressServer.listen(8001, '0.0.0.0')