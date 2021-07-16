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
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4) + BUFtoHEX(await window.crypto.subtle.exportKey('raw', this.pub_key)) + this.signature; // + ...
    }

    rawDataString(utxo_db) {
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4) + utxo_db.get(this.dbKey()).pub_key_hash;
    }

    dbKey() {
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4);
    }
}

class TXOutput {

    constructor(amount, pub_key_hash){
        this.amount = amount;
        this.pub_key_hash = pub_key_hash;
    }

    dataString(){
        return this.amount + this.pub_key_hash;
    }
}





// TODO/NOTE: could pass in the raw strings instead of he input and output objects, more work for client
// but don't need the database and can more easily replace the string with the scriptsig

// Important note: create the transaction hash with the signatures as the temporary old utxo pub keys, then re-fill the signatures
// by signing the hash with the private key, and add the pub key paramter
// https://bitcoin.stackexchange.com/questions/3374/how-to-redeem-a-basic-tx/
async function createTransactionData(raw_inputs, new_outputs, utxo_db, private_key, public_key) {

    /**
     * Raw Transaction Data:
     * 
     * 1 byte integer for number of inputs
     * for each input:
     * 32 byte hash of the transaction you want to redeem an output from
     * 4 byte field of the index of the output from the above transaction
     * 32 byte pub key hash of the utxo's address
     * ^^ From the stack overflow link: "For the purpose of signing the transaction, 
     * the scriptPubKey of the output we want to redeem is filled as the temporary script sig"
     * 
     * 1 byte integer for number of outputs
     * for each output:
     * 8 byte field for the amount of "satoshis" to send
     * 32 byte address hash to send the "satoshis" to
    */
    let raw_transaction_data = '';

    let num_inputs_hex = intToByteLengthHexString(raw_inputs.length, 1);
    let num_outputs_hex = intToByteLengthHexString(new_outputs.length, 1);

    raw_transaction_data += num_inputs_hex;

    for(let i = 0; i < raw_inputs.length; i++){
        raw_transaction_data += raw_inputs[i].rawDataString(utxo_db);
    }

    // output string doesn't change for final data, can save some time with this
    let saved_output_string = '';
    saved_output_string += num_outputs_hex;

    raw_transaction_data += num_outputs_hex;
    
    for(let i = 0; i < new_outputs.length; i++){
        raw_transaction_data += new_outputs.dataString();
        saved_output_string += new_outputs.dataString();
    }

    let raw_transaction_data_hash = await hashBuffer(HEXtoBUF(raw_transaction_data));
    let tx_signature = await signMessage(private_key, raw_transaction_data_hash);

    //////////// Below this is where the final transaction data is created, maybe make another function ////////////

    let final_transaction_data = '';

    final_transaction_data += num_inputs_hex;

    // Now you need to replace the temporary utxo pub key hashes in the input datastrings with the signature and public key (scriptSig)
    for(let i = 0; i < raw_inputs.length; i++){
        raw_inputs[i].signature = tx_signature;
        raw_inputs[i].pub_key = public_key;
        final_transaction_data += raw_inputs[i].dataString();
    }

    final_transaction_data += saved_output_string;
    
    return final_transaction_data;
}

// decode the transaction hex string, simple for now but need to account for multiple inputs and outputs eventually
function transactionObjectFromData(tx_data){

    let tx = {

        hash: '', // Important problem here, need to hash the raw data not the final one with script sigs

        inputs:[

        ],

        outputs:[

        ]

    }

    let num_inputs = parseInt(tx_data.substr(0, 2), 16);

    let total_string_offset = 2;

    for(let i = 0; i < num_inputs; i++){
        
        // may need to be a TXInput here
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

        // May need to be a TXOutput here
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
