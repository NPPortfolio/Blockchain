
// Using qvault "how sha-2 works step by step" tutorial
function myHash(str) {


    /**
    *   Step 1: Pre-Processing
    */


    // Convert to binary
    let binary_string = strToBinaryStr(str);

    let original_binary_length = binary_string.length;

    // Append a single 1
    binary_string += "1";

    // Pad with 0’s until data is a multiple of 512, less 64 bits
    for (let i = binary_string.length; (i + 64) % 512 != 0; i++) {
        binary_string += "0";
    }

    // Append 64 bits to the end, where the 64 bits are a big-endian integer representing the length of the original input in binary.
    binary_string += original_binary_length.toString(2).padStart(64, '0');


    /**
    *   Step 2: Initialize hash values
    */


    // Now we create 8 hash values. These are hard-coded constants that represent the first 32 bits of the fractional parts
    // of the square roots of the first 8 primes: 2, 3, 5, 7, 11, 13, 17, 19
    let h0 = hexStrToBinaryStr('6a09e667').padStart(32, '0');
    let h1 = hexStrToBinaryStr('bb67ae85').padStart(32, '0');
    let h2 = hexStrToBinaryStr('3c6ef372').padStart(32, '0');
    let h3 = hexStrToBinaryStr('a54ff53a').padStart(32, '0');
    let h4 = hexStrToBinaryStr('510e527f').padStart(32, '0');
    let h5 = hexStrToBinaryStr('9b05688c').padStart(32, '0');
    let h6 = hexStrToBinaryStr('1f83d9ab').padStart(32, '0');
    let h7 = hexStrToBinaryStr('5be0cd19').padStart(32, '0');


    /**
    *   Step 3: Initialize Round Constants
    */


    // Each value (0-63) is the first 32 bits of the fractional parts of the cube roots of the first 64 primes (2 – 311).
    let constants = [
        '428a2f98', '71374491', 'b5c0fbcf', 'e9b5dba5', '3956c25b', '59f111f1', '923f82a4', 'ab1c5ed5',
        'd807aa98', '12835b01', '243185be', '550c7dc3', '72be5d74', '80deb1fe', '9bdc06a7', 'c19bf174',
        'e49b69c1', 'efbe4786', '0fc19dc6', '240ca1cc', '2de92c6f', '4a7484aa', '5cb0a9dc', '76f988da',
        '983e5152', 'a831c66d', 'b00327c8', 'bf597fc7', 'c6e00bf3', 'd5a79147', '06ca6351', '14292967',
        '27b70a85', '2e1b2138', '4d2c6dfc', '53380d13', '650a7354', '766a0abb', '81c2c92e', '92722c85',
        'a2bfe8a1', 'a81a664b', 'c24b8b70', 'c76c51a3', 'd192e819', 'd6990624', 'f40e3585', '106aa070',
        '19a4c116', '1e376c08', '2748774c', '34b0bcb5', '391c0cb3', '4ed8aa4a', '5b9cca4f', '682e6ff3',
        '748f82ee', '78a5636f', '84c87814', '8cc70208', '90befffa', 'a4506ceb', 'bef9a3f7', 'c67178f2'
    ];

    for(let i = 0; i < constants.length; i++){
        constants[i] = hexStrToBinaryStr(constants[i]).padStart(32, '0');
    }

    console.log(constants);


    /**
    *   Step 4: Chunk Loop
    * 
    *   The following steps will happen for each 512-bit “chunk” of data from our input. 
    *   At each iteration of the loop, we will be mutating the hash values h0-h7, which will be the final output.
    */


    // variables to use in the loop
    let w = new Array(64);

    let s0 = 00000000;
    let s1 = 00000000;

    //for something...{


    /**
    *   Step 5: Create Message Schedule
    */

    //Copy the input data from step 1 into a new array where each entry is a 32-bit word:
    for (let i = 0; i < 16; i++) {

        // Warning: I don't know if the leading 0s are stored in the array as well, need to look into this
        // Make this a string
        w[i] = binary_string.substring(i * 32, (i + 1) * 32);
    }

    //Add 48 more words initialized to zero, such that we have an array w[0…63]
    for (let i = 16; i < 64; i++) {
        w[i] = 0;
    }


    for (let i = 16; i < 64; i++) {

        //s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >> 3);
        //s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >> 10);

        /*
        s0 = strXOR(

            strXOR(
                strRightRotate(w[i - 15], 7),
                strRightRotate(w[i - 15], 18)
            ),

            strRightShift(w[i - 15], 3)
        );

        s1 = strXOR(

            strXOR(
                strRightRotate(w[i - 2], 17),
                strRightRotate(w[i - 2], 19)
            ),

            strRightShift(w[i - 2], 10)
        );*/


        s0 = strXORmultiple([strRightRotate(w[i - 15], 7), strRightRotate(w[i - 15], 18), strRightShift(w[i - 15], 3)]);

        s1 = strXORmultiple([strRightRotate(w[i - 2], 17), strRightRotate(w[i - 2], 19), strRightShift(w[i - 2], 10)]);

        //w[i] = strADD(strADD(w[i - 16], s0), strADD(w[i - 7], s1));
        w[i] = strADDmultiple([w[i-16], s0, w[i - 7], s1]);


        //w[i] = w[i - 16] + s0 + w[i - 7] + s1;
    }

    //}

    /**
    *   Step 6: Compression
    */


    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {

        s1 = strXORmultiple([strRightRotate(e, 6), strRightRotate(e, 11), strRightRotate(e, 25)]);
        
        let ch = strXOR(strAND(e, f), strAND(strNOT(e), g));

        let temp1 = strADDmultiple([h, s1, ch, constants[i], w[i]]);

        s0 = strXORmultiple([strRightRotate(a, 2), strRightRotate(a, 13), strRightRotate(a, 22)]);

        let maj = strXORmultiple([strAND(a, b), strAND(a, c), strAND(b, c)]);

        let temp2 = strADD(s0, maj);

        h = g;
        g = f;
        f = e;
        e = strADD(d, temp1);
        d = c;
        c = b;
        b = a;
        a = strADD(temp1, temp2);



    }

    h0 = strADD(h0, a);
    h1 = strADD(h1, b);
    h2 = strADD(h2, c);
    h3 = strADD(h3, d);
    h4 = strADD(h4, e);
    h5 = strADD(h5, f);
    h6 = strADD(h6, g);
    h7 = strADD(h7, h);


    /*
    console.log(a);
    console.log(b);
    console.log(c);
    console.log(d);
    console.log(e);
    console.log(f);
    console.log(g);
    console.log(h);
    */

    // outside of chunk loop
    return h0 + h1 + h2 + h3 + h4 + h5 + h6 + h7;
}


function hexStrToBinaryStr(str){
    return parseInt(str, 16).toString(2);
}


function strToBinaryStr(str) {

    // could define max length by string length here for optimization
    let binary_string = '';

    let x = '';

    for (let i = 0; i < str.length; i++) {

        // This doesn't seem very good performance wise
        x = str.charCodeAt(i).toString(2);
        x = x.padStart(8, '0');
        binary_string += x;
    }

    return binary_string;
}







function strRightRotate(str, amount) {

    return str.substring(str.length - amount) + str.substring(0, str.length - amount);
}

console.log(strRightRotate('10111100011', 6));





function strRightShift(str, amount) {

    return str.substring(0, str.length - amount).padStart(str.length, '0');
}



function strNOT(str){

    let result = '';

    for(let i = 0; i < str.length; i++){
        if(str.charAt(i) == '1') result += '0';
        else result += '1';
    }

    return result;
}

function strAND(str1, str2){

    let result = '';

    for(let i = 0; i < str1.length; i++){

        result += str1.charAt(i) & str2.charAt(i);
    }

    return result;
}


function strXOR(str1, str2) {

    let result = '';

    for (let i = 0; i < str1.length; i++) {

        result += str1.charAt(i) ^ str2.charAt(i);
    }

    return result;
}

function strXORmultiple(args) {

    let result = args[0];

    for (let i = 1; i < args.length; i++) {
        result = strXOR(result, args[i]);
    }

    return result
}





function strADD(str1, str2) {

    let result = '';
    let remainder = 0;
    let total = 0;

    for (let i = str1.length - 1; i >= 0; i--) {

        total = (str1.charAt(i) | 0) + (str2.charAt(i) | 0) + remainder;
        result = total % 2 + result;
        if (total >= 2) remainder = 1;
        else remainder = 0;
    }

    return result;
}

function strADDmultiple(args){

    let result = args[0];

    for(let i = 1; i < args.length; i++){
        result = strADD(result, args[i]);
    }

    return result;
}

let result = myHash("hello world");
console.log(result);