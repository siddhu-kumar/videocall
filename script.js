
const userName = "Hello-World*" + Math.floor(Math.random()*1000);
const password = "x";

document.querySelector("#user-name").innerHTML = userName;


const socket = io.connect("https://192.168.1.9:8001/", {
    auth: {
        userName,
        password,
    }
})
const localVideoEl = document.querySelector("#local-video");
const remoteVideoEl = document.querySelector("#remote-video");

let localStream; // a var hold the local video stream
let remoteStream; // a var hold the remote video stream
let peerConnection; // the peerConnection that the two client use to talk
let didIOffer = false;

const peerConfiguration = {
    iceServers: [{
        urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302'
        ]
    }]
}

const call = async (e) => {

    await fetchUserMedia();

    await createPeerConnection()

    try {
        console.log("create offer")
        const offer = await peerConnection.createOffer()
        console.log(offer)
        peerConnection.setLocalDescription(offer);
        didIOffer = true;
        socket.emit('newOffer',offer)
    } catch(err) {
        console.log(err)
    }
}

const fetchUserMedia = async () => {
    
    return new Promise( async (resolve, reject) => {
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                // audio: true,
            })
            localVideoEl.srcObject = stream;
            localStream = stream;
            console.log(localStream)
            resolve();
        } catch(err) {
            console.log(err);
            reject();
        }
    })
    
}

const hangup = async (e) => {
    console.log('hello ')
    const d = socket.disconnect();
    console.log(d)
    const c = socket.disconnect();
    console.log(c )
}

const addAnswer = async (offerObj) => {
    await peerConnection.setRemoteDescription(offerObj.answer)
    // console.log(peerConnection.signalingState)
}

const answerOffer = async (offerObj) => {
    await fetchUserMedia();
    await createPeerConnection(offerObj);

    const answer = await peerConnection.createAnswer({})
    await peerConnection.setLocalDescription(answer)
    console.log(offerObj)
    console.log(answer)
    // console.log(peerConnection.signalingState) // have-local-pranswer because 
    // add answer to offerObj to inform server, offer is related to
    offerObj.answer = answer 
    // emit answer to signaling server to route client1
    const offerIceCandidates = await socket.emitWithAck('newAnswer',offerObj)
    offerIceCandidates.forEach(c=>{
        peerConnection.addIceCandidate(c);
        console.log('---------')
    })
    console.log(offerIceCandidates)

}

const createPeerConnection = async (offerObj) => {
    return new Promise (async (resolve, reject) => {

        peerConnection = await new RTCPeerConnection(peerConfiguration);
        remoteStream = new MediaStream();
        remoteVideoEl.srcObject = remoteStream;

        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        })

        peerConnection.addEventListener("signalingstatechange",(e) => {
            console.log(e);
            console.log(peerConnection.signalingState)
        })

        peerConnection.addEventListener("track",(e)=> {
            console.log("got a track")
            console.log(e); 
            e.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track,remoteStream);
            })
        })

        peerConnection.addEventListener('icecandidate', e => {
            console.log('Ice Candidate Found')
            console.log(e)
            if(e.candidate) {
                socket.emit('sendIceCandidateToSignalingServer', {
                    iceCandidate: e.candidate, 
                    iceUserName: userName,
                    didIOffer,
                })
            }
        })
        if(offerObj) {
            // false - call();
            // true - answerOffer();
            console.log(peerConnection.signalingState)
            await peerConnection.setRemoteDescription(offerObj.offer)
            console.log(peerConnection.signalingState)
        }
        resolve();
    }) 
}
const addNewIceCandidate = (iceCandidate) => {
    peerConnection.addIceCandidate(iceCandidate); 
}




document.querySelector("#call").addEventListener('click',call);
document.querySelector('#hangup').addEventListener('click',hangup)

 