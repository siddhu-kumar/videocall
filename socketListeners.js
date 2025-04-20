
socket.on('availableOffers', (offers) => {
    console.log(offers)
    createOfferEls(offers)
})

socket.on('newOfferAwaiting', (offers) =>{
    createOfferEls(offers)
})

socket.on('answerResponse', (offerObj)=> {
    console.log(offerObj)
    addAnswer(offerObj)
})

socket.on('receivedIceCandidateFromServer',iceCandidate => {
    addNewIceCandidate(iceCandidate);
})

function createOfferEls (offers) {
    const answerEl = document.querySelector('#answer')
    offers.forEach(element => {
        console.log(element)
        const newOfferEl = document.createElement('div')
        newOfferEl.innerHTML = `<button class="btn btn-success col-1">Answer</button>`
        newOfferEl.addEventListener('click',()=>answerOffer(element))
        answerEl.appendChild(newOfferEl)
    });
}