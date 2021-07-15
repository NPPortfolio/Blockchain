class Transaction {

    constructor() {

        this.id = '';
        this.inputs = [];
        this.outputs = [];
    }

    async dataString() {

        let concat = '';

        for (let i = 0; i < this.inputs.length; i++) {
            concat += await this.inputs[i].dataString();
        }

        for (let i = 0; i < this.outputs.length; i++) {
            concat += this.outputs[i].dataString();
        }

        return concat;
        //return await hashString(concat);
    }

    async rawDataString(utxo_db) {

        let concat = '';

        for (let i = 0; i < this.inputs.length; i++) {
            concat += this.inputs[i].rawDataString(utxo_db);
        }

        for (let i = 0; i < this.outputs.length; i++) {
            concat += this.outputs[i].dataString();
        }
    }

    async createHashID() {
        this.id = await hashBuffer(HEXtoBUF(this.dataString()));
        return this.id;
    }

    addInput(tx_input) {
        this.inputs.push(tx_input);
    }

    addOutput(tx_output) {
        this.outputs.push(tx_output);
    }

    totalOutputAmount() {

        let total = 0;

        for (let i = 0; i < this.outputs.length; i++) {
            total += this.outputs[i].value;
        }

        return total;
    }
}

class TXInput {

    constructor(tx_id, tx_index, pub_key, signature) {
        this.tx_id = tx_id; // 32 byte hash string
        this.tx_index = tx_index; // four bytes
        this.pub_key = pub_key; // the public key corresponding to the private key used to make the signature
        this.signature = signature;
    }

    async dataString() {
        //previous id + index + scriptSig
        return this.tx_id + toByteLengthHexString(this.tx_index, 4) + BUFtoHEX(await window.crypto.subtle.exportKey('raw', this.pub_key)) + this.signature; // + ...
    }

    rawDataString(utxo_db) {
        return this.tx_id + toByteLengthHexString(this.tx_index, 4) + utxo_db.get(this.dbKey()).pub_key_hash;
    }

    dbKey() {
        return this.tx_id + toByteLengthHexString(this.tx_index, 4);
    }
}

class TXOutput {

    constructor(value, pub_key_hash) {
        this.value = value; // 8 bytes, integer
        this.pub_key_hash = pub_key_hash;
    }

    dataString() {
        return toByteLengthHexString(this.value, 8) + this.pub_key_hash;
    }
}

// TODO: multiple inputs and outputs, add num to the transaction data
// Important note: create the transaction hash with the signatures as the temporary old utxo pub keys, then re-fill the signatures
// by signing the hash with the private key, and add the pub key paramter
// https://bitcoin.stackexchange.com/questions/3374/how-to-redeem-a-basic-tx/
async function createTransactionData(utxo_id, utxo_index, utxo_pub_key_hash, address_hash, amount, private_key, public_key) {



    /**
    eccf7e3034189b851985d871f91384b8ee357cd47c3024736e5676eb2debb3f2 tx hash
    01000000 index
    76a914010966776006953d5567439e5e39f86a0d273bee88ac    temporary, scriptPubKey, replace with sig + pub key
    605af40500000000    Amount
    76a914097072524438d003d23a2f23edb65aae1bb3e46988ac    actual scriptPubKey
     */

    // need some kind of checking or spec for amount to be 8 bytes
    // This is without all of the length bytes or opcode bytes, because this project limits to P2PKH and 1 input 1 output (should change 1 in 1 out eventually)
    let raw_transaction_data =
        utxo_id + // 32 byte hash of the transaction you want to redeem an output from
        utxo_index + // 4 byte field denoting the index of the output from the above transaction
        utxo_pub_key_hash + // From the stack overflow link: "For the purpose of signing the transaction, the scriptPubKey of the output we want to redeem is filled as the temporary script sig"
        amount + // 8 byte field containing the amount we want to redeem from the specified output (tx id + index) for btc in satoshis
        address_hash // this transaction's output, new pub key hash to pay to
    ;

    let raw_transaction_data_hash = await hashBuffer(HEXtoBUF(raw_transaction_data));

    let tx_signature = await signMessage(private_key, raw_transaction_data_hash);

    // Could replace old string instead of constructing a new one
    let final_transaction_data = 
        utxo_id + 
        utxo_index + 
        BUFtoHEX(tx_signature) + // These two replace the temporary pub key hash in the raw transaction. Also, this is 64 bytes
        public_key + // 32 bytes?
        amount + 
        address_hash
    ;
    
    return final_transaction_data;

    /**
    // Now that we signed the transaction, we can add the signatures to the inputs
    let tx_in = new TXInput(utxo_id, utxo_index, public_key, tx_signature);
    let tx_out = new TXOutput(amount, address_hash);

    let tx = new Transaction();
    tx.addInput(tx_in);
    tx.addOutput(tx_out);

    return tx;
    */
}

// decode the transaction hex string, simple for now but need to account for multiple inputs and outputs eventually
function createTransactionObject(tx_data){

    let tx = {

        hash: '', // Important problem here

        inputs:[

        ],

        outputs:[

        ]

    }

    let num_inputs = parseInt(tx_data.substr(0, 2), 16);

    let total_string_offset = 2;

    for(let i = 0; i < num_inputs; i++){
        
        let obj = {
            tx_id: null,
            tx_index: null,
            signature: null,
            pub_key: null,
        }

        obj.tx_id = tx_data.substr(total_string_offset, 64); total_string_offset += 64; // 32 byte transaction hash
        obj.tx_index = tx_data.substr(total_string_offset, 8); total_string_offset += 8; // 4 byte index
        obj.signature = tx_data.substr(total_string_offset, 128); total_string_offset += 128; // 64 byte signature
        obj.public_key = tx_data.substr(total_string_offset, 64); total_string_offset += 64; // 32 byte public key

        tx.inputs.push(obj);
    }

    // At this point the total_string_offset should be at the number of outputs

    let num_outputs = parseInt(tx_data.substr(total_string_offset, 2), 16);

    total_string_offset += 2;

    for(let i = 0; i < num_outputs; i++){

        let obj = {
            amount: null,
            address_hash: null,
        }

        obj.amount = tx_data.substr(total_string_offset, 16); total_string_offset += 16; // 8 byte satoshi amount
        obj.address_hash = tx_data.substr(total_string_offset, 64); total_string_offset += 64; // 32 byte address hash

        tx.outputs.push(obj);
    }


    // What to do about the hash? Need to replace sig and pub key?

}

// Writing this to verify it only if it hasnt been processed yet - utxo vs all txo db
async function verifyTransaction(tx, utxo_db) {





    // PROBLEM: need to reconstruct the raw transaction data, which has no scriptSig(sig or pubkey) from the given transaction
    // This means accessing the utxo db to get the previous pub key hash which was temporarily used to make the raw data and hash
    // Also means that you cant call the same dataString() method on the test (raw) transaciton, need another way to reconstruct with the substitutes pub key hash

    let total_in = tx.totalInputAmount();
    let total_out = tx.totalOutputAmount();

    if (total_in < total_out) {
        console.log("Error: attempting to spend more coins than the input allows");
        return false;
    }

    if (!verifyInputs(tx)) {
        // A few possible errors here, the utxo might not exist in the DB, or the signature might not be valid
    }
    //console.log(await test_tx.dataString());
    //console.log(BUFtoHEX(hash_to_test));


    // just the first input for testing, need to test all of them i guess
    //return await verifyMessage(sig_pubkey_pairs_to_test[0].pub_key, sig_pubkey_pairs_to_test[0].sig, hash_to_test);
}










(async function () {

    let UTXODB = new Map();

    const key_pair = await window.crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256"

        },
        true,
        ["sign", "verify"]
    );

    let pubKeyBuffer = await window.crypto.subtle.exportKey('raw', key_pair.publicKey);
    let pubKeyHash = await hashBuffer(pubKeyBuffer);

    // Create an original utxo for testing purposes
    let txo_1 = new TXOutput(8, BUFtoHEX(pubKeyHash));

    let dummy_hash = BUFtoHEX(await hashBuffer(UTF16toBUF('dummy')));

    // index 0 for one output
    UTXODB.set(dummy_hash + '00000000', txo_1);


    /*
    (async function () {

        let output = UTXODB.get(dummy_hash + '00000000');
        let tx = await createTransaction(dummy_hash, '00000000', output.pub_key_hash, output.pub_key_hash, 2, key_pair.privateKey, key_pair.publicKey);
        console.log(await verifyTransaction(tx, UTXODB));

    })();
    */

})();
