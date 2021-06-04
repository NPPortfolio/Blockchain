// This function was partly taken from stack overflow
// "How to test for equality in ArrayBuffer, DataView, and TypedArray"             
function areBuffersEqual(buf1, buf2) {
    if (buf1.byteLength != buf2.byteLength) return false;
    var view1 = new Uint8Array(buf1);
    var view2 = new Uint8Array(buf2);
    for (var i = 0; i != buf1.byteLength; i++) {
        if (view1[i] != view2[i]) return false;
    }
    return true;
}

function isBufferLessThan(buf1, buf2){
    if (buf1.byteLength < buf2.byteLength) return true;
    var view1 = new Uint8Array(buf1);
    var view2 = new Uint8Array(buf2);
    for(var i = 0; i!= buf1.byteLength; i++){
        if(view1[i] < view2[i]) return true;
        if(view1[i] > view2[i]) return false;
        // If they are equal continue loop to look at next 8 bits
    }

    // If it reaches here they are equal
    return false;
}

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

    // could check to make sure they are both binary ArrayBuffers here
    return isBufferLessThan(digest, target);
}

function random32bitNonce(){
    let nonce = new Uint32Array(1);
    window.crypto.getRandomValues(nonce);
    return nonce;
}