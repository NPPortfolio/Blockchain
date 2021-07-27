/**
 * Transaction Class
 * 
 * @member {String} id Hex String hash of the final transaction data (with scriptsigs instead of temp utxo pubkeys)
 * @member {TXInput[]} inputs The list of inputs that spend the coins from utxos
 * @member {TXOutput[]} outputs The list of outputs that the coins are sent to
 */
class Transaction {

    constructor() {

        this.id = '';
        this.inputs = [];
        this.outputs = [];
    }

    /**
     * Return a hexadecimal string of the final data in the transaction
     * This is the data that is hashed to give the transaction its ID
     * 
     * @returns {String} The hexadecimal string representing the final data of the transaction 
     */
    async dataString() {

        let concat = '';

        for (let i = 0; i < this.inputs.length; i++) {
            concat += await this.inputs[i].dataString();
        }

        for (let i = 0; i < this.outputs.length; i++) {
            concat += this.outputs[i].dataString();
        }

        return concat;
    }

    /**
     * Returns the raw hexadecimal string of the transaction
     * This string is what the final inputs sign to create the scriptSigs
     * 
     * @param {Map} utxodb The UTXO database that the inputs temporarily use in the raw tx data
     * 
     * @returns {String} Hexadecimal string of the raw transaction data (inputs have temp utxo pub key hashes, not sigscripts)
     */
    rawDataString(utxodb) {

        let concat = '';

        for (let i = 0; i < this.inputs.length; i++) {
            concat += this.inputs[i].rawDataString(utxodb);
        }

        for (let i = 0; i < this.outputs.length; i++) {
            concat += this.outputs[i].dataString();
        }

        return concat;
    }

    /**
     * Rendering function, returns a custom html string to display the transaction
     * 
     * @returns {String} HTML string with all data you want to display
     */
    async HTMLString() {

        let input_string = '';
        let output_string = '';

        for (let i = 0; i < this.inputs.length; i++) {
            input_string += await this.inputs[i].HTMLString();
        }

        for (let i = 0; i < this.outputs.length; i++) {
            output_string += this.outputs[i].HTMLString();
        }

        let final =
            '<div class = \'transaction\'>' +
            '<p>Hash (ID): ' + this.id +
            '<p>Inputs: </p>' +
            input_string +
            '<p>Outputs: </p>' +
            output_string +
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

    addOutputsToUTXODB(utxodb) {

        for (let i = 0; i < this.outputs.length; i++) {
            // I might need to be careful here with the outputs[i] object reference, may need to copy the object
            utxodb.set(this.id + intToByteLengthHexString(i, 4), this.outputs[i]);
        }
    }
}

/**
 * Transaction Input Class
 * Note: The byte sizes refer to the length of the data when representing them in a transaction data string
 * 
 * @member {String} tx_id 32B: A Hexadecimal String of the hash of the transaction the spent utxo is from 
 * @member {integer} tx_index 4B: The index of the utxo in the tx_id transaction
 * @member {CryptoKey} pub_key 32B: The public key corresponding to the private key used to make this input's signature
 * @member {ArrayBuffer} signature 64B: The signature of the raw transaction data of the transaction this input is a part of 
 */
class TXInput {

    constructor(tx_id, tx_index, pub_key, signature) {
        this.tx_id = tx_id;
        this.tx_index = tx_index;
        this.pub_key = pub_key; 
        this.signature = signature;
    }

    async dataString() {
        //previous id + index + scriptSig
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4) + cryptoKeyToHex(this.pub_key) + BUFtoHEX(this.signature); // + ...
    }

    rawDataString(utxo_db) {
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4) + utxo_db.get(this.dbKey()).pub_key_hash;
    }

    /**
     * Rendering function, returns a custom html string to display the transaction
     * Note: This and the transaction HTMLString are async because of the need to export the cryptokey to
     *       an arraybuffer, could store the key as a hex string as well, but needs verification
     * 
     * @returns {String} HTML string with all data you want to display
     */
    async HTMLString() {

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

    /**
     * Get the string that will be used as a key in the UTXO database (Transaction ID + index)
     * 
     * @returns {String} The database key
     */
    dbKey() {
        return this.tx_id + intToByteLengthHexString(this.tx_index, 4);
    }
}

/**
 * Transaction Output Class
 * Note: The byte sizes refer to the length of the data when representing them in a transaction data string
 * 
 * @member {Integer} amount 8B: The number of 'satoshis' to give to the address
 * @member {String} pub_key_hash 32B: The address that can use this output for spending
 */
class TXOutput {

    constructor(amount, pub_key_hash) {
        this.amount = amount; // 8 byte
        this.pub_key_hash = pub_key_hash; // 32 byte
    }

    /**
     * Rendering function, returns a custom html string to display the transaction
     * 
     * @returns {String} HTML string with all data you want to display
     */
    HTMLString() {

        let x =
            '<div class = \'transaction-output\'>' +
            '<p>Amount: ' + this.amount + '</p>' +
            '<p>Address: ' + BUFtoHEX(this.pub_key_hash) + '</p>' +
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



/**
 * Creates a transaction object from a transaction data string
 * Note/TODO: Again, I don't know if this function should specifically check and enforce the format, or put that responsibility on the client
 * 
 * @param {String} tx_data The hexadecimal string representing the final transaction data. Must follow the protocol for transaction data strings,
 *                         see readme for info
 * 
 * @returns {Transaction} Final Transaction object
 */
async function createTransactionFromString(tx_data) {

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

        let obj = new TXInput();

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
        let obj = new TXOutput();

        obj.amount = tx_data.substr(total_string_offset, 16); total_string_offset += 16; // 8 byte satoshi amount
        obj.address_hash = tx_data.substr(total_string_offset, 64); total_string_offset += 64; // 32 byte address hash

        tx.outputs.push(obj);
    }

    // I think this used to be an error where I hashed the raw tx data for the ID, need the final data (with scriptSigs)
    await tx.createHashID();

    return tx;

}
/**
 * Testing Strategy
 */
(async function () {

    // Set up a final transaction string

    // Set up an object with the same values

    // Need an equals operator?

});


/**
 * Constructor function to create a transaction from TXInput and TXOutput objects
 * 
 * @param {TXInput[]} inputs Array of transaction inputs
 * @param {TXOutput[]} outputs Array of transaction outputs
 * 
 * @returns The created transaction, with the calculated hash from the data added by the input and outputs
 */
async function createTransactionFromObjects(inputs, outputs) {

    let tx = new Transaction();

    inputs.forEach(e => {
        tx.addInput(e);
    });

    outputs.forEach(e => {
        tx.addOutput(e);
    });

    await tx.createHashID();

    return tx;
}
/**
 * Testing Strategy
 * 
 */
(async function () {
    // I don't know if this function really should be tested, maybe set up some tests for an expected transaction ID given inputs and outputs
})();

/**
 * Verifies a transaction in the context of the given utxo database
 * 
 * @param {Transaction} tx The transaction object to verify 
 * @param {Map} utxo_db The database of the utxos that the transaction uses as inputs
 *   
 * @returns True if the transaction is valid for the given database, false otherwise 
 */
async function verifyTransaction(tx, utxodb) {

    let total_input_amount = 0; // There could be a totalInputAmount() where you pass the utxodb, not sure if this is good for preformance or not
    let total_output_amount = tx.totalOutputAmount();

    //TODO: also need to check that the transaction hash == the final transaction data hashed


    let raw_transaction_data = createRawTransactionData(tx.inputs, tx.outputs, utxodb);
    // Important Note: This is different from the eventual final transaction hash, but when constructing this is what was signed
    let raw_transaction_data_hash = await hashBuffer(BUFtoHEX(raw_transaction_data));

    for (let i = 0; i < tx.inputs.length; i++) {

        if ((await verifyTransactionInput(tx.inputs[i], raw_transaction_data_hash, utxodb)) == false) {
            console.log("Error validating transaction: One of the inputs could not be validated");
            return false;
        }

        // At this point the input should be valid
        // Some performance waste here, researching the database to get the amount, but keeps the return value to a clean boolean
        total_input_amount += utxodb.get(tx.inputs[i].dbKey()).amount;
    }

    // If you need to validate the outputs for any reason you would do it here


    if (total_output_amount > total_input_amount) {
        console.log("Error validating transaction: Attempting to spend more coins than the inputs allow");
        return false;
    }

    // At this point the transaction should be valid
    return true;
}
/**
 * Testing strategy
 * 
 * total_output_amount: <=> total_input_amount
 * 
 * tx.inputs.length: empty, >=1, <=> tx.outputs.length
 * tx.outputs.length: empty, >=1, <=> tx.inputs.length
 * 
 * Test cases for valid inputs are in the verifyTransactionInput function tests
 * 
 */
(async function () {

})();


/**
 * Verifies an input of a transaction
 * 
 * @param {TXInput} input The transaction input to verify
 * @param {ArrayBuffer} txid The RAW (no scriptsigs) id of the transaction that the input is verified to be a part of,
 *                           not the final hash that identifies the complete transaction
 * @param {Map} utxodb The utxo database that the transaction input spends from
 * 
 * @returns {boolean} True if the input is valid, false if invalid
 */
async function verifyTransactionInput(input, raw_hash, utxodb) {

    let utxo = utxodb.get(input.dbKey());

    if (utxo === undefined) {
        console.log("Error validating transaction input: The unspent transaction output listed in the input could not be found in the database");
        return false;
    }

    // Make sure the raw data of the transaction was signed correctly
    if (! await verifyMessage(input.pub_key, input.signature, raw_hash)) {
        // Would need a better error message here
        console.log("Error validating transaction input: The input did not have the correct signature for the transaction ID")
        return false;
    }

    // P2PKH only, need to do a lot of script things here in bitcoin
    // Also this is not good for privacy, more about this in readme
    let address_hash = await hashBuffer(await window.crypto.subtle.exportKey('raw', input.pub_key));
    if (address_hash != utxo.pub_key_hash) {
        console.log("Error validating transaction input: The hash of the public key in the input does not match the pub key hash of the spent utxo");
        return false;
    }

    return true;

}
/**
 * Testing strategy
 * 
 * input: valid, not in database, incorrect signature, incorrect public key
 */
(async function () {

})();




/**
 * Testing strategy
 *
 * Note: when creating the transaction data it isn't really possible to have an expected string because of the
 * need to add signatures to the raw data once it is hashed (If the raw data is in a separate function this could change a little).
 * This function for now is being tested by setting up some scenarios and manually checking the logs of the data,
 * which is not ideal, but would need a more sophisticated testing environment to use assertions when dealing with
 * hashes and signatures. The verification can use asserts though because you can set up transactions you know
 * are valid or invalid.

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
*/


















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
