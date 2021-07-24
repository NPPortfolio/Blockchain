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

    async htmlString(){

        let internal = '';

        for(let i = 0; i < this.inputs.length; i++){
            internal += this.inputs[i].htmlString();
        }

        for(let i = 0; i < this.outputs.length; i++){
            internal += this.outputs[i].htmlString();
        }

        let final = 
        '<div class = \'transaction\'>' +

        internal +

        '</div>'
        ;

        return final;
    }

    async createHashID() {
        this.id = BUFtoHEX(await hashBuffer(HEXtoBUF(this.dataString())));
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

    addOutputsToUTXODB(utxodb){
        
        for(let i = 0; i < this.outputs.length; i++){
            // I might need to be careful here with the outputs[i] object reference, may need to copy the object
            utxodb.set(this.id + intToByteLengthHexString(i, 4), this.outputs[i]);
        }
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
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4) + cryptoKeyToHex(this.pub_key) + BUFtoHEX(this.signature); // + ...
    }

    rawDataString(utxo_db) {
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4) + utxo_db.get(this.dbKey()).pub_key_hash;
    }

    async htmlString() {

        let x =

        '<div class = \'transaction-input\'>' +
            '<p>Previous TXID: ' + this.tx_id + '</p>' +
            '<p>Previous UTXO index: ' + intToByteLengthHexString(this.tx_index) + '</p>' +
            '<p>Signer\'s Public Key: ' + BUFtoHEX(await window.crypto.subtle.exportKey('raw', this.pub_key)) + '</p>' +
            '<p>Signature: ' + BUFtoHEX(this.signature); + '</p>' +
        '</div>'
        ;

        return x;
    }

    dbKey() {
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4);
    }
}

class TXOutput {

    constructor(amount, pub_key_hash) {
        this.amount = amount;
        this.pub_key_hash = pub_key_hash;
        this.spent = false; // Testing this for the UTXODB, some problems with it
    }

    hmtlString() {

        let x =
            '<div class = \'transaction-output\'>' +
            '<p>Amount: ' + this.amount + '</p>' +
            '<p>Address: ' + this.pub_key_hash + '</p>' +
            '</div>'
            ;
        
        return x;
    }

    dataString() {
        return intToByteLengthHexString(this.amount, 8) + BUFtoHEX(this.pub_key_hash);
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

// TODO: better function would be signRawTransaction, which would need a bit of parsing but not reuse code
async function createFinalTransactionData(raw_inputs, new_outputs, utxo_db, private_key, public_key) {

    /**
     * Final transaction data:
     * 
     * Same as the raw transaction data, with the signature and provided public key replacing the old raw inputs
     */
    let num_inputs_hex = intToByteLengthHexString(raw_inputs.length, 1);
    let num_outputs_hex = intToByteLengthHexString(new_outputs.length, 1);

    let raw_transaction_data = createRawTransactionData(raw_inputs, new_outputs, utxo_db);
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

    // This part is repeating the process for the raw transaction data, could parse the string or have a better function setup
    final_transaction_data += num_outputs_hex;

    for (let i = 0; i < new_outputs.length; i++) {
        final_transaction_data += new_outputs[i].dataString();
    }

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

    let tx_obj = await transactionObjectFromData(tx);

    // check for overspending first to fail fast
    if (tx_obj.totalInputAmount() < tx_obj.totalOutputAmount()) {
        // Specific error codes would be a good idea
        console.log('Error validating transaction: Attempting to spend more coins than the utxo inputs allow');
        return false;
    }

    let raw_transaction_data = createRawTransactionData(tx_obj.inputs, tx_obj.outputs, utxo_db);

    let id = await hashBuffer(BUFtoHEX(raw_transaction_data));

    for (let i = 0; i < tx_obj.inputs.length; i++) {

        let utxo = utxo_db.get(tx_obj.inputs[i].dbKey());

        if (utxo === undefined) {
            console.log("Error validating transaction: One of the unspent transactions listed in an input could not be found in the database");
            return false;
        }

        // Make sure the raw data of the transaction was signed correctly
        if (! await verifyMessage(tx_obj.inputs[i].pub_key, tx_obj.inputs[i].signature, id)) {
            // Would need a better error message here
            console.log("Error validating transaction: One of the inputs to the transaction did not have the correct signature for the transaction")
            return false;
        }

        // P2PKH only, need to do a lot of script things here in bitcoin
        // Also this is not good for privacy, more about this in readme
        let address_hash = await hashBuffer(await window.crypto.subtle.exportKey('raw', tx_obj.inputs[i].pub_key));
        if (address_hash != utxo.pub_key_hash) {
            console.log("Error validating transaction: The hash of the public key in the transaction input does not match the pub key hash of the spent utxo");
            return false;
        }
    }

    // At this point the transaction should be valid. TODO: add the outputs to utxo DB? remove used ones?
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
