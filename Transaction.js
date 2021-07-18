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

    rawDataString(utxo_db) {

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
        this.tx_index = tx_index; // 4 bytes
        this.pub_key = pub_key; // 32 byte public key corresponding to the private key used to make the signature
        this.signature = signature; // 64 bytes
    }

    async dataString() {
        //previous id + index + scriptSig
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4) + BUFtoHEX(await window.crypto.subtle.exportKey('raw', this.pub_key)) + BUFtoHEX(this.signature); // + ...
    }

    rawDataString(utxo_db) {
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4) + utxo_db.get(this.dbKey()).pub_key_hash;
    }

    dbKey() {
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4);
    }
}

class TXOutput {

    constructor(amount, pub_key_hash) {
        this.amount = amount;
        this.pub_key_hash = pub_key_hash;
    }

    dataString() {
        return intToByteLengthHexString(this.amount, 8) + this.pub_key_hash;
    }
}





function createRawTransactionData(raw_inputs, new_outputs, utxo_db) {

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

    for (let i = 0; i < raw_inputs.length; i++) {
        raw_transaction_data += raw_inputs[i].rawDataString(utxo_db);
    }

    raw_transaction_data += num_outputs_hex;

    for (let i = 0; i < new_outputs.length; i++) {
        raw_transaction_data += new_outputs[i].dataString();
    }

    return raw_transaction_data;
}

async function createFinalTransactionData(raw_transaction_data, private_key, public_key){

    let num_inputs_hex = intToByteLengthHexString(raw_inputs.length, 1);
    let num_outputs_hex = intToByteLengthHexString(new_outputs.length, 1);

    let raw_transaction_data_hash = await hashBuffer(HEXtoBUF(raw_transaction_data));
    let tx_signature = await signMessage(private_key, raw_transaction_data_hash);
    let final_transaction_data = '';

    final_transaction_data += num_inputs_hex;

    // Now you need to replace the temporary utxo pub key hashes in the input datastrings with the signature and public key (scriptSig)
    for (let i = 0; i < raw_inputs.length; i++) {
        raw_inputs[i].signature = tx_signature;
        raw_inputs[i].pub_key = public_key;
        final_transaction_data += await raw_inputs[i].dataString();
    }

    final_transaction_data += saved_output_string;

    return final_transaction_data;
}



// decode the transaction hex string
async function transactionObjectFromData(tx_data, utxo_db) {

    let tx = {

        hash: '',

        inputs: [

        ],

        outputs: [

        ]

    }

    let num_inputs = parseInt(tx_data.substr(0, 2), 16);

    let total_string_offset = 2;

    for (let i = 0; i < num_inputs; i++) {

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

    for (let i = 0; i < num_outputs; i++) {

        // May need to be a TXOutput here
        let obj = {
            amount: null,
            address_hash: null,
        }

        obj.amount = tx_data.substr(total_string_offset, 16); total_string_offset += 16; // 8 byte satoshi amount
        obj.address_hash = tx_data.substr(total_string_offset, 64); total_string_offset += 64; // 32 byte address hash

        tx.outputs.push(obj);
    }

    // Need to recreate the raw data without the signatures and with the temporary pub key hashes from utxo_db
    let raw_transaction_data = createRawTransactionData(obj.inputs, obj.outputs, utxo_db);
    tx.hash = await hashBuffer(HEXtoBUF(raw_transaction_data));

    return tx;

}

// Writing this to verify it only if it hasnt been processed yet - utxo vs all txo db

// The main point here is that the final transaction data would be the data that is sent to some node to verify, so this function
// is the one that verifies all of the hashes, signatures, etc without outside influence
async function verifyFinalTransactionData(tx, utxo_db) {

    // Things this function needs to do: (can split up in future)

    // To check if its valid:

    // could check for input amount >= output amount first to fail fast
    // Hash the raw string to get the transaction id
    // for each input,
        // make sure the utxo is in the database, and it isn't unspent (TODO)
        // verifyMessage(public_key, signature, transaction id)
        // hash(public_key) = utxo.pub_key_hash (pay to pub key hash only project), this would be running the script with inputs in biutcoin

    // If it's valid:
  
    // add all the outputs to the utxo_db
    // Mark used utxo's as spent?

    let tx_obj = transactionObjectFromData(tx);

    if(tx_obj.totalInputAmount() < tx_obj.totalOutputAmount()){
        // Specific error codes would be a good idea
        console.log('Error validating transaction: Attempting to spend more coins than the utxo inputs allow');
        return false;
    }

}







/**
 * Testing strategy
 * 
 * Note: when creating the transaction data it isn't really possible to have an expected string because of the
 * need to add signatures to the raw data once it is hashed (If the raw data is in a separate function this could change a little).
 * This function for now is being tested by setting up some scenarios and manually checking the logs of the data,
 * which is not ideal, but would need a more sophisticated testing environment to use assertions when dealing with
 * hashes and signatures. The verification can use asserts though because you can set up transactions you know
 * are valid or invalid.
 */
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

    // Create some utxo's for testing purposes
    let utxo_1 = new TXOutput(8, BUFtoHEX(pubKeyHash));
    let utxo_2 = new TXOutput(10, BUFtoHEX(pubKeyHash));

    let dummy_hash1 = BUFtoHEX(await hashBuffer(UTF16toBUF('dummy1')));
    let dummy_hash2 = BUFtoHEX(await hashBuffer(UTF16toBUF('dummy2')));

    UTXODB.set(dummy_hash1 + '00000000', utxo_1); // index 0
    UTXODB.set(dummy_hash2 + '00000001', utxo_2); // index 1

    let txi_1 = new TXInput(dummy_hash1, '00000000', '', ''); // sig and pub key dont matter when creating the transaction
    let txi_2 = new TXInput(dummy_hash2, '00000001', '', '');

    let dummy_address = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
    console.assert(dummy_address.length == 64);

    let txo_1 = new TXOutput(18, dummy_address);
    let txo_2 = new TXOutput(0, dummy_address);
    let txo_3 = new TXOutput(10, dummy_address);

    // TODO: fix raw transaction to final transaction, need inputs and outputs so maybe just keep them combined
    // TODO/NOTE: sending one public key makes each scriptsig the same
    // num inputs > 1, num outputs > 1
    //let raw_tx_data = await createRawTransactionData([txi_1, txi_2], [txo_1], UTXODB);
    //let final_tx_data = await createFinalTransactionData(raw_tx_data, key_pair.privateKey, key_pair.publicKey);


    // See note in testing strategy section for why this is just a log and not an assertion
    //console.log(final_tx_data);

    // await verifyTransaction(tx_data, UTXODB);

    // num inputs = 0, num outputs > 0
    // Need a separate system for this to be a valid coinbase transaction
})();


















////////////////////////// May be useful later, if not delete ////////////////////////////////

/**
// original finction that creates the raw and final transaction data from the inputs and outputs
async function createTransactionData(raw_inputs, new_outputs, utxo_db, private_key, public_key) {

    /*
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
    
    let raw_transaction_data = '';

    let num_inputs_hex = intToByteLengthHexString(raw_inputs.length, 1);
    let num_outputs_hex = intToByteLengthHexString(new_outputs.length, 1);

    raw_transaction_data += num_inputs_hex;

    for (let i = 0; i < raw_inputs.length; i++) {
        raw_transaction_data += raw_inputs[i].rawDataString(utxo_db);
    }

    // output string doesn't change for final data, can save some time with this
    let saved_output_string = '';
    saved_output_string += num_outputs_hex;

    raw_transaction_data += num_outputs_hex;

    for (let i = 0; i < new_outputs.length; i++) {
        raw_transaction_data += new_outputs[i].dataString();
        saved_output_string += new_outputs[i].dataString();
    }

    let raw_transaction_data_hash = await hashBuffer(HEXtoBUF(raw_transaction_data));
    let tx_signature = await signMessage(private_key, raw_transaction_data_hash);

    //////////// Below this is where the final transaction data is created, maybe make another function ////////////

    let final_transaction_data = '';

    final_transaction_data += num_inputs_hex;

    // Now you need to replace the temporary utxo pub key hashes in the input datastrings with the signature and public key (scriptSig)
    for (let i = 0; i < raw_inputs.length; i++) {
        raw_inputs[i].signature = tx_signature;
        raw_inputs[i].pub_key = public_key;
        final_transaction_data += await raw_inputs[i].dataString();
    }

    final_transaction_data += saved_output_string;

    return final_transaction_data;
}
*/
