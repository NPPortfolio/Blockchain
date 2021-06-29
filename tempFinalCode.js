/**
 * Tests the relationship between two buffers, where each buffer represents an unsigned binary integer
 * Empty Buffers are treated as the number 0, buffers can have different number of bits 
 * 
 * @param {ArrayBuffer} buf1 
 * @param {ArrayBuffer} buf2
 * @return -1: if buf1 < buf2
 *          0: if buf1 = buf2
 *          1: if buf1 > buf2
 */
function compareBuffers(buf1, buf2) {

    // First you need to deal with the scenario where a larger byte length buffer represents a smaller number than the smaller byte length buffer
    let difference = buf1.byteLength - buf2.byteLength;
    let larger = null;
    let smaller = null;

    if (difference > 0) {
        larger = buf1;
        smaller = buf2
    }

    else {
        larger = buf2;
        smaller = buf1;
    }

    // If the buffer with more bits has a 1 anywhere in a more significant place than the smaller's left-most bit
    if (difference != 0 && largerHasMoreSignificant1Bit(larger, Math.abs(difference))) {
        return (smaller == buf1) ? -1 : 1;
    }

    // Now you can compare them side by side
    let smaller_view = new Uint8Array(smaller);
    let larger_view = new Uint8Array(larger);

    // could manually check for empty here


    for (let i = 0; i < smaller_view.length; i++) {
        if (smaller_view[i] < larger_view[i + Math.abs(difference)]) {
            return (smaller == buf1) ? -1 : 1;
        }

        if(smaller_view[i] > larger_view[i + Math.abs(difference)]){
            return (smaller == buf1) ? 1: -1;
        }

        // If the byte chunks are equal continue the loop to lesser significant bits
    }

    // If it reaches here they are equal
    return 0;

    // need to document this too
    function largerHasMoreSignificant1Bit(buf, bytes_to_test) {

        let view = new Uint8Array(buf);
        for (let i = 0; i < bytes_to_test; i++) {
            if (view[i] != 0) return true;
        }
        return false;
    }
}
/**
 * Testing strategy
 * 
 * buf1.byteLength: 0, >0, < = > buf2.byteLength
 * buf2.byteLength: 0, >0, < = > buf1.byteLength
 * 
 * bits in buffers: all zeroes
 * 
 * relationship: buf1 < buf2, buf1 = buf2, buf1 > buf2
 *        
 * 
 */
 (function () {

    let b1_empty = new ArrayBuffer();
    let b2_empty = new ArrayBuffer();

    console.assert(compareBuffers(b1_empty, b2_empty) == 0);

    // This is not ideal for testing, as there is an extra manual step of converting to binary from an unsigned int for certain tests
    let b1 = new Uint8Array([1]).buffer; // 00000001
    let b2 = new Uint8Array([4]).buffer; // 00000100

    console.assert(compareBuffers(b1, b2) == -1);
    console.assert(compareBuffers(b2, b1) == 1);

    let b3 = new Uint8Array([2]).buffer;
    let b4 = new Uint8Array([4, 2]).buffer;

    console.assert(compareBuffers(b3, b4) == -1);
    console.assert(compareBuffers(b4, b3) == 1);

    console.assert(compareBuffers(b3, b1_empty) == 1);
    console.assert(compareBuffers(b1_empty, b3) == -1);
    // Both of the above exit quickly because b3 has more bits and one bit set, so these tests are important
    let b_zero = new Uint8Array([0]);
    console.assert(compareBuffers(b1_empty, b_zero) == 0);
    console.assert(compareBuffers(b_zero, b1_empty) == 0);

    let b5 = new Uint8Array([0, 0, 0, 2]).buffer;
    let b6 = new Uint8Array([2]).buffer;

    console.assert(compareBuffers(b5, b6) == 0);
    console.assert(compareBuffers(b3, b6) == 0);

    // ...

})();



// only sha-256, could add algorithm as parameter
async function hashString(str) {

    let buffer = str2ab(str);
    const digest = await SC.digest('SHA-256', buffer);

    return digest;
}


function clamp(x, min, max) {
    return Math.min(max, Math.max(x, min));
}

// tutorial code from google developers web updates site

function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}


/**
 * 
 * @param {ArrayBuffer} digest The binary hash to be tested against the target, needs to be smaller than the target
 * @param {ArrayBuffer} target The binary value to test the digest against
 * @returns {boolean} true if the digest is smaller than the target, false otherwise NOTE: may want this to be <=
 */
function testProofOfWork(digest, target) {

    return compareBuffers(digest, target) == -1;
}

function random32bitNonce() {
    let nonce = new Uint32Array(1);
    window.crypto.getRandomValues(nonce);
    return nonce;
}