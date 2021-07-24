let STATE = {
    blocks: [],
    pending_transactions: [],
    UTXODB: new Map()
};

(async function main() {

    let Origin = new Block();
    Origin.message = 'ORIGIN';
    Origin.nonce = 'ORIGIN';
    Origin.previous_hash = 'ORIGIN';
    await Origin.createHash();

    let keypair1 = await window.crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256"

        },
        true,
        ["sign", "verify"]
    );

    let keypair2 = await window.crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256"

        },
        true,
        ["sign", "verify"]
    );

    let address1 = await hashBuffer(await KEYtoBUF(keypair1.publicKey));
    let address2 = await hashBuffer(await KEYtoBUF(keypair2.publicKey));

    let coinbase_tx = new Transaction();
    let coinbase_output1 = new TXOutput(10, address1);
    let coinbase_output2 = new TXOutput(5, address2);

    coinbase_tx.addOutput(coinbase_output1);
    coinbase_tx.addOutput(coinbase_output2);

    await coinbase_tx.createHashID();

    coinbase_tx.addOutputsToUTXODB(STATE.UTXODB);

    STATE.blocks.push(Origin);

    renderState(STATE);
})();

function setNewOrigin(state, Block) {
    state.blocks = [];
    state.pending_transactions = [];
    state.UTXODB = [];
    state.blocks.push(Block);
}

function renderState(state) {

    document.getElementById('blockchain').innerHTML = '';
    document.getElementById('pending-transactions').innerHTML = '';

    state.blocks.forEach(element => {
        document.getElementById('blockchain').innerHTML += element.HTMLString();
    });

    state.pending_transactions.forEach(element => {
        document.getElementById('pending-transactions').innerHTML += element.HTMLString();
    });

    document.getElementById('UTXODB').innerHTML = mapToHTML(state.UTXODB);
}

function mapToHTML(map) {

    let inner = '';

    map.forEach((value, key) => {
        inner += '<div class = utxo>' +
            '<p> TXID: ' + key.substr(0, 64) + '</p>' + // 32 byte transaction hash in hex
            '<p> UTXO Index: ' + key.substr(64, 8) + '</p>' + // 4 byte utxo index
            // The rest of the info (amount and address) can be found from the list of transactions, probably want to repeat here though
            '</div>';
    });

    return inner;
}