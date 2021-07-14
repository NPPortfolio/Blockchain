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

        if (smaller_view[i] > larger_view[i + Math.abs(difference)]) {
            return (smaller == buf1) ? 1 : -1;
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
 * important case: bytelength of one buffer is larger, but number in the other buffer is larger
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








// tutorial code from google developers web updates site
/**
 * Create a binary ArrayBuffer from a string
 * 
 * @param {string} str 
 * @returns the binary ArrayBuffer created from a given string using charCodeAt (UTF-16)
 */
function UTF16toBUF(str) {
    let buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    let bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

/**
 * 
 * @param {*} buf 
 * @returns 
 */
function HEXtoBUF(hex_string) {
    // 1/2 byte for each character. If the hex string length is odd, which would mean there is a half byte somewhere and
    // probably shouldn't happen, it will add one hex character with Math.ceil()
    let buf = new ArrayBuffer(Math.ceil(hex_string.length / 2));
    let view = new Uint8Array(buf);
    for(let i = 0; i < hex_string.length; i+=2){
        let one_byte_string = hex_string.substr(i, 2); // wrong for odd length hex strings?
        let x = parseInt(one_byte_string, 16);
        view[i/2] = x;
    }
    return buf;
}

/**
 * Creates a hexadecimal string from an ArrayBuffer
 * 
 * @param {ArrayBuffer} buf binary data
 * @returns The hexadecimal string representing the binary data in buf
 */
function BUFtoHEX(buf) {

    let result = '';

    let view = new Uint8Array(buf);

    for (let i = 0; i < view.length; i++) {
        // The pad start is so a half-byte isn't added to the string
        // ('F' being added to the string instead of '0F')
        result += view[i].toString(16).padStart(2, '0');
    }

    return result;
}

/**
 * Creates a binary string from an ArrayBuffer
 * Note: could also combine this function with BUFtoHEX
 * 
 * @param {ArrayBuffer} buf binary data
 * @returns The UTF16 string from the binary data in the buf
 */
function BUFtoUTF16(buf) {

}

/**
 * Testing strategy
 * 
 * The above four functions are tested together. The goal of testing these is to make sure the
 * binary data in an ArrayBuffer matches that of the passed in string, but to compare it to the expected value
 * you need to view the ArrayBuffer as something. It takes some extra steps to break down the expected binary values
 * of the original string to an array of Uint8 or Uint16, so the functions can convert it all to a string
 * then compare it to a calculated expected string. This doesn't seem ideal and would be a lot easier with better
 * binary number representation, but should provide some insight to correctness
 * 
 * str: empty, 1 char, > 1 char
 */
(function () {

    // NOTE/TODO: I haven't actually needed a use for BUFtoUTF16 yet so it isn't implemented but the test skeletons are there

    // expected values calculated using rapidtables.com    

    // IIFE to be able to reuse variable names
    // Also this could all be improved with environments or something more automated

    // Testing going from hexString to buffer back to hexString
    (function () {
        let str = 'ffff';
        let str_buf = HEXtoBUF(str);
        let str_post = BUFtoHEX(str_buf);
        let str_expected = 'ffff';
        console.assert(str_post == str_expected);
    })();

    (function () {
        let str = 'f850e446';
        let str_buf = HEXtoBUF(str);
        let str_post = BUFtoHEX(str_buf);
        let str_expected = 'f850e446';
        //console.log(str_post);
        console.assert(str_post == str_expected);
    })();




    // Testing going from UTF16 string to buffer back to UTF16 string
    (function () {
        let str = 'hello';
        let str_buf = UTF16toBUF(str);
        let str_post = BUFtoUTF16(str_buf);
        let str_expected = 'hello';
        //console.log(str_post);
        //console.assert(str_post == str_expected);
    })();

    (function () {
        let str = '12345678';
        let str_buf = UTF16toBUF(str);
        let str_post = BUFtoUTF16(str_buf);
        let str_expected = '12345678';
        //console.log(str_post);
        //console.assert(str_post == str_expected);
    })();




    // Testing going from hexString to buf to UTF16String
    (function () {
        let str = '';
        let str_buf = HEXtoBUF(str);
        let str_post = BUFtoUTF16(str_buf);
        let str_expected = '';
        //console.log(str_post);
        //console.assert(str_post == str_expected);
    })();

    (function () {
        let str = '';
        let str_buf = HEXtoBUF(str);
        let str_post = BUFtoUTF16(str_buf);
        let str_expected = '';
        //console.log(str_post);
        //console.assert(str_post == str_expected);
    })();




    // Testing going from UTF16 string to buffer to hexString
    (function () {
        let str = 'Hello World';
        let str_buf = UTF16toBUF(str);
        let str_post = BUFtoHEX(str_buf);
        let str_expected = '480065006c006c006f00200057006f0072006c006400';
        console.assert(str_post == str_expected);
    })();

    (function () {
        let str = '';
        let str_buf = UTF16toBUF(str);
        let str_post = BUFtoHEX(str_buf);
        let str_expected = '';
        console.assert(str_post == str_expected);
    })();

    (function () {
        let str = 'g';
        let str_buf = UTF16toBUF(str);
        let str_post = BUFtoHEX(str_buf);
        let str_expected = '6700';
        console.assert(str_post == str_expected);
    })();

    // Binary string testing if the function is ever needed

})();








/**
 * Tests whether the given binary hash is less than the given target hash, or in terms of the blockchain, meaning 
 * it has a certain number of leading zeroes defined by the target
 * 
 * @param {ArrayBuffer} digest The binary hash to be tested against the target, needs to be smaller than the target
 * @param {ArrayBuffer} target The binary value to test the digest against
 * @returns {boolean} true if the digest is smaller than the target, false otherwise NOTE: may want this to be <=
 */
function testProofOfWork(digest, target) {
    return compareBuffers(digest, target) == -1;
}
/**
 * Testing strategy
 * 
 * Most of the testing for this function is covered in the compareBuffers tests
 * --> Maybe test two buffers anyway
 */








/**
 * Creates a 256 bit ArrayBuffer representing a number that is one larger than the largest binary number
 * with the given number of leading zeroes
 * 
 * @param {int} num_leading_zeroes range from 1-256
 * 
 * @returns {ArrayBuffer} The buffer with the target number
 */
function create256BitTargetBuffer(num_leading_zeroes) {

    // could clamp here to ensure range

    let buf = new ArrayBuffer(32); // 32 bytes

    let view = new Uint8Array(buf);

    // index of the Uint8 chunk num_leading_zeroes into the array
    let uint8_index = Math.floor((num_leading_zeroes - 1) / 8);

    // index of bit to flip in the Uint8 chunk, from left to right
    let bit_index = Math.floor((num_leading_zeroes - 1) % 8);

    // ...
    view[uint8_index] = Math.pow(2, 7 - bit_index);

    return view.buffer;
}
/**
 * Testing strategy
 * 
 * num_leading_zeroes: 1, 256, >1 && <256 
 * 
 * Again, this assumes that compareBuffers is correct, and needs a manual conversion from some array to buffer with DataView
 */
(function () {

    // Note to write down: Can't use Uint32Array buffers because of endianness
    let buf = null;
    let dv = null;

    buf = new ArrayBuffer(32);
    dv = new DataView(buf);
    dv.setUint32(0, 2147483648); //Uint32Array([2147483648, 0, 0, 0, 0, 0, 0, 0]) with big endian multi-byte number representation
    console.assert(compareBuffers(create256BitTargetBuffer(1), buf) == 0);

    buf = new ArrayBuffer(32);
    dv = new DataView(buf);
    dv.setUint32(7 * 4, 1); //Uint32Array([0, 0, 0, 0, 0, 0, 0, 1]) with big endian multi-byte number representation
    console.assert(compareBuffers(create256BitTargetBuffer(256), buf) == 0);

    buf = new ArrayBuffer(32);
    dv = new DataView(buf);
    dv.setUint32(3 * 4, 268435456); //Uint32Array([0, 0, 0, 268435456, 0, 0, 0, 0]) with big endian multi-byte number representation
    console.assert(compareBuffers(create256BitTargetBuffer(100), buf) == 0);

})();




/**
 * Pads a hexadecimal string to the given byteLength by adding 0's
 * 
 * @param {String} num A hexadecimal string
 * @param {int} byteLength The byteLength to pad the string to
 * 
 * @returns {String} The padded hex string 
 */
function toByteLengthHexString(num, byteLength) {
    // 4 bits to a hex character, so byteLength * 2
    return num.toString(16).padStart(byteLength * 2, '0');
}
/**
 * Testing strategy
 * 
 * num length: 0, > 0, odd, even
 * num length relationship to byteLength: <=> byteLength * 2
 */
(function (){

})();






// Extra function with no file to put in yet
/**
 * Clamps a value between the given min and max using javascripts Math Object min() and max() functions
 * Note: the parameters are not restricted to numbers because the min() and max() functions are not and use ToNumber(),
 * see those specifications for more info about different cases
 * 
 * Preconditions: min <= max // Note: I don't exactly know the best way to handle things like this. If the specifications are assumed to be like a contract,
 *                                    then there is no need to check for this in the function, but in some cases it might be useful or necessary
 * 
 * @param  x 
 * @param  min 
 * @param  max 
 * 
 * @returns new value with value: x if x >= min && x <= max;
 *                                max if x > max;
 *                                min if x < min;
 */
function clamp(x, min, max) {
    return Math.min(max, Math.max(x, min));
}
/**
 * Testing strategy
 * 
 * Note: testing could go even deeper with certain primitive types, like int/float etc
 * 
 * x, min, max: 0, negative, positive
 * 
 * relationships: x < min, x > max, x > min && x < max
 *                x == min, x == max, min == max // See note in function spec for why min > max is not tested
 */
(function () {

    console.assert(clamp(0, -1, 1) == 0);
    console.assert(clamp(0.5, -1, 1) == 0.5);
    console.assert(clamp(1, 0, 2) == 1);
    console.assert(clamp(40, 25, 60) == 40);
    console.assert(clamp(-4, -8, -2) == -4);

    console.assert(clamp(-8, -4, -2) == -4);
    console.assert(clamp(2, -2, -1) == -1);
    console.assert(clamp(50, 0, 25) == 25);
    console.assert(clamp(10, 25, 50) == 25);

    console.assert(clamp(0, 20, 20) == 20);
    console.assert(clamp(20, 20, 20) == 20);
    console.assert(clamp(0, 0, 0) == 0);

    // ...

})();