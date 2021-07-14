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

// Important note: create the transaction hash with the signatures as the temporary old utxo pub keys, then re-fill the signatures
// by signing the hash with the private key, and add the pub key paramter
// https://bitcoin.stackexchange.com/questions/3374/how-to-redeem-a-basic-tx/
async function createTransaction(utxo_id, utxo_index, utxo_pub_key_hash, address_hash, amount, private_key, public_key) {

    // need some kind of checking or spec for amount to be 8 bytes
    // This is without all of the length bytes or opcode bytes, because this project limits to P2PKH and 1 input 1 output (should change 1 in 1 out eventually)
    let raw_transaction_data =
        utxo_id + // 32 byte hash of the transaction you want to redeem an output from
        utxo_index + // 4 byte field denoting the index of the output from the above transaction
        utxo_pub_key_hash + // From the stack overflow link: "For the purpose of signing the transaction, the scriptPubKey of the output we want to redeem is filled as the temporary script sig"
        amount + // 8 byte field containing the amount we want to redeem from the specified output (tx id + index) for btc in satoshis
        address_hash // this transaction's output, new pub key hash to pay to
        ;

    console.log(raw_transaction_data);

    let raw_transaction_data_hash = await hashBuffer(HEXtoBUF(raw_transaction_data));
    //console.log(BUFtoHEX(raw_transaction_data_hash));

    let tx_signature = await signMessage(private_key, raw_transaction_data_hash);

    // Now that we signed the transaction, we can add the signatures to the inputs
    let tx_in = new TXInput(utxo_id, utxo_index, public_key, tx_signature);
    let tx_out = new TXOutput(amount, address_hash);

    let tx = new Transaction();
    tx.addInput(tx_in);
    tx.addOutput(tx_out);

    return tx;
}

// Writing this to verify it only if it hasnt been processed yet - utxo vs all txo db
async function verifyTransaction(tx, utxo_db) {





    // PROBLEM: need to reconstruct the raw transaction data, which has no scriptSig(sig or pubkey) from the given transaction
    // This means accessing the utxo db to get the previous pub key hash which was temporarily used to make the raw data and hash
    // Also means that you cant call the same dataString() method on the test (raw) transaciton, need another way to reconstruct with the substitutes pub key hash






    let sig_pubkey_pairs_to_test = [];

    let total_in = 0;
    let total_out = tx.totalOutputAmount();

    // Need to have a modified version of the transaction where all of the script signatures are replaced with the
    // pub key hash of the old utxo's that funded the inputs of the transaction, because that's how the transaction hash is calculated.
    for (let i = 0; i < tx.inputs.length; i++) {

        let old_input = tx.inputs[i];

        let old_input_utxo = utxo_db.get(old_input.dbKey());

        // part to change later
        if (old_input_utxo === undefined) {
            // error an incoming utxo for this transaction doesn't exist in the DB
            return false;
        }

        // Problem: input needs to have cryptokey pubkey and signature sig, but this step the data has to be replaced by a hex format string, dataString() wont work
        let test_input = new TXInput(old_input.tx_id, old_input.tx_index, old_input_utxo.pub_key_hash, ''); // Important line here something's up -> maybe just fixed

        sig_pubkey_pairs_to_test.push(
            {
                sig: old_input.signature,
                pub_key: old_input.pub_key
            }
        );

        //test_tx.addInput(test_input);

        total_in += old_input_utxo.value;
    }

    if (total_in < total_out) {
        console.log("Error: attempting to spend more coins than the input allows");
        return false;
    }

    //let hash_to_test = await hashBuffer(HEXtoBUF(await test_tx.dataString()));

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
