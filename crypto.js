/**
 * Asynchronously hash a string using SHA-256
 * 
 * @param {string} str The string to be hashed
 * @returns {Promise} Once the digest is complete and the promise fulfilled, 
 * the successful result is the ArrayBuffer representing the 32 byte hash of the string
 */
 async function hashUTF16String(str) {

    let buffer = UTF16toBUF(str);
    const digest = await window.crypto.subtle.digest('SHA-256', buffer);

    return digest;
}
/**
 * Testing strategy
 * 
 * The testing for UTF16toBUF in buffer.js should be enough for this function, the other line is the window's crypto function
 */

/**
 * Hashes an ArrayBuffer using SHA-256
 * 
 * @param {ArrayBuffer} buf the buffer to hash 
 * @returns {ArrayBuffer} the 256 bit hash of the data in buf
 */
async function hashBuffer(buf){
    const digest = await window.crypto.subtle.digest('SHA-256', buf);
    return digest;
}

/**
 * Signs a message in an ArrayBuffer with a private key, using the window.crypto.subtle sign() method
 * 
 * @param {CryptoKey} privateKey The private key of the user to sign the data. In order to verify the signature the associated public key must be used
 * @param {ArrayBuffer} data An ArrayBuffer of the data to be signed
 * @returns 
 */
async function signMessage(privateKey, data) {

    let signature = await window.crypto.subtle.sign(
        {
            name: "ECDSA",
            hash: "SHA-256" // Note: mozilla code has (hash: {name: "SHA-384:"}), not sure why
        },
        privateKey,
        data
    );

    return signature;
}

/**
 * Verifies a signature is valid for the given data using the window.crypto.subtle verify() method and a given public key
 * 
 * @param {CryptoKey} publicKey A public key, for the signature to be verified needs to be the key associated with the private key used to create signature 
 * @param {ArrayBuffer} signature A signature, to be valid needs to be of the given data using the associated private key 
 * @param {ArrayBuffer} data The data to check the signature against 
 * @returns 
 */
async function verifyMessage(publicKey, signature, data) {

    let result = await window.crypto.subtle.verify(
        {
            name: "ECDSA",
            hash: "SHA-256" // Note: mozilla code has (hash: {name: "SHA-384:"}), not sure why
        },
        publicKey,
        signature,
        data
    );

    return result
}
/**
 * Testing strategy
 * 
 * The functions above are mostly helper functions for using the window.crypto.subtle functions, so there is not much that could go wrong, but the below
 * tests are useful for outlining some scenarios
 * 
 * Some scenarios were commented above the tests below, could formally write them here
 */
(async function () {

    const key_pair1 = await window.crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256"

        },
        true,
        ["sign", "verify"]
    );

    const key_pair2 = await window.crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256"

        },
        true,
        ["sign", "verify"]
    );

    let message1 = UTF16toBUF("This message was sent by key_pair1");
    let message2 = UTF16toBUF("This message was sent by key_pair2");

    const signature1 = await signMessage(key_pair1.privateKey, message1);
    const signature2 = await signMessage(key_pair2.privateKey, message2);

    let test1 = await verifyMessage(key_pair1.publicKey, signature1, message1);
    let test2 = await verifyMessage(key_pair2.publicKey, signature2, message2);

    // Make sure a correctly signed message is verified
    console.assert(test1 == true);
    console.assert(test2 == true);

    // Make sure another public key can't verify the message
    let test3 = await verifyMessage(key_pair2.publicKey, signature1, message1);
    console.assert(test3 == false);

    // Make sure a matched public key and signature cant verify a different message, that they didn't sign
    let test4 = await verifyMessage(key_pair1.publicKey, signature1, message2);
    console.assert(test4 == false);

    // Not sure what this is intuitively
    let test5 = await verifyMessage(key_pair1.publicKey, signature2, message1);
    console.assert(test5 == false);

    // These tests make sure two different signatures from the same private key cant be used for another message
    let message3 = UTF16toBUF("This is a third message");
    
    const signature3 = await signMessage(key_pair1.privateKey, message3);

    let test6 = await verifyMessage(key_pair1.publicKey, signature3, message1);
    let test7 = await verifyMessage(key_pair1.publicKey, signature1, message3);
    let test8 = await verifyMessage(key_pair1.publicKey, signature3, message3);

    console.assert(test6 == false);
    console.assert(test7 == false);
    console.assert(test8 == true);

    // ...
})();




/**
 * Create a Uint32Array of length 1 representing a randomized sequence of 32 bits
 * Might (Probably) want to change this to return the ArrayBuffer for small convenience
 * 
 * @returns {Uint32Array} The randomized bits
 */
 function random32bitNonce() {
    let nonce = new Uint32Array(1);
    window.crypto.getRandomValues(nonce);
    return nonce;
}
/**
 * Testing strategy
 * 
 * Not much testing to do here, maybe test if successive calls give different numbers,
 * but the function is mostly using window.crypto 
 */