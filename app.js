let STATE = {
    blocks: [],
    pending_transactions: [],
    UTXODB: new Map()
}

(async function main(){

    let blocks = [];
    let pending_transactions = [];
    let UTXODB = new Map();

    let Origin = new Block();
    Origin.message = 'ORIGIN';
    await Origin.createHash();
})();

function setNewOrigin(state, Block){
    state.blocks = [];
    state.pending_transactions = [];
    state.UTXODB = [];
    state.blocks.push(Block);
}

function renderState(state){

    state.blocks.forEach(element => {
        document.getElementByID('blockchain').innerHTML += element.HTMLelement();
    });

    state.pending_transactions.forEach(element => {
        document.getElementByID('blockchain').innerHTML += element.HTMLelement();
    });

    document.getElementByID('UTXODB').innerHTML = mapToHTML(state.UTXODB);
}

function mapToHTML(map){

}