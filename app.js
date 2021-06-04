let SC = window.crypto.subtle;

class User {

    constructor() {
        this.name_ = '';
        //this.key_pair = null;

        this.should_mine = true;

        this.chain_origin = null;
        this.target_block = null;

        this.DOM_element = document.createElement("div");



    }

    setTargetBlock(b) {
        this.target_block = b;
    }

    startMining() {
        this.should_mine = true;
        this.updateDOMproperties();
        this.mine();
    }

    stopMining() {
        this.should_mine = false;
        this.updateDOMproperties();
    }

    mine() {

        // note here about random nonce being not good in more complex system
        const promise = tryRandomNonce(this.target_block.getHashString(), this.name, TARGET);

        promise.then(

            result => {
                this.handleMiningResult(result);
            },

            error => {
                throw (error);
            }

        );

    }

    handleMiningResult(result) {

        if (result == null) {
            if (this.should_mine) this.mine();
        }

        else {
            console.log(this.name + " found a hash");
            console.log(result);

            // You cant always just add it to the target block in case it was changed while mining,
            // have to find the block again by hash (or rewrite mining function to keep track of block TODO)
            addChildToChain(this.chain_origin, result);

            // not optimized
            this.target_block = findDeepestNode(this.chain_origin);
            this.mine();
        }
    }


    // UI
    updateDOMproperties() {
        this.DOM_element.innerHTML =
            this.name + "\n" +
            (this.is_mining ? "Mining" : "Idle") +
            "\n";
    }
}

class Block {

    constructor() {

        this.hash = '';

        // Contents that are hashed
        this.previous_hash = '';
        this.message = '';
        this.nonce = '';
        // ------------------------

        this.children = [];

    }

    // This is the data that is hashed to give each block a unique hash, can add more stuff to it as I go
    getHeader() {
        return this.previous_hash + this.message + this.nonce;
    }

    getHashString() {
        return this.hash;
    }

    // Create a string representation of an ArrayBuffer hash, called when the async hashString function is done
    createHashString(buf) {
        this.hash = buf2HexString(buf);
    }

    addChild(block) {

        this.children.push(block);


        drawTree(ctx, Origin);
        /*
        console.log("START OF TREE -------------------------------------------------------------");
        this.logTree();
        console.log("END OF TREE ---------------------------------------------------------------")
        */
    }

    log() {
        console.log("-------------------------------------");
        console.log("Previous hash: " + this.previous_hash);
        console.log("Message: " + this.message);
        console.log("nonce: " + this.nonce);
        console.log("hash: " + this.hash);
        console.log("-------------------------------------");
    }

    logTree() {
        this.log();
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].logTree();
        }
    }
}






// 
function addChildToChain(chain_origin, new_block) {

    let block = findBlockByHash(chain_origin, new_block.previous_hash);

    block.addChild(new_block);
}


// stackoverflow 
function findBlockByHash(current_block, block_hash) {

    // These are both hex strings
    if (current_block.hash == block_hash) {
        return current_block;
    }


    else if (current_block.children.length != 0) {

        for (let i = 0; i < current_block.children.length; i++) {

            let result = findBlockByHash(current_block.children[i], block_hash);

            if (result != null) {
                return result
            }
        }

        return null;
    }

    return null;

}

// Always returns leftmost block when tied, might be a problem
function findDeepestNode(root) {

    let max_level = -1;
    let deepest_node = null;

    function recursiveTest(current_block, current_depth) {


        if(current_depth > max_level){
            max_level = current_depth;
            deepest_node = current_block;
        }

        if (current_block.children.length == 0) {
            return;
        }

        else {
            for (let i = 0; i < current_block.children.length; i++) {

                recursiveTest(current_block.children[i], current_depth + 1);

            }
        }
    }

    recursiveTest(root, 0);

    return deepest_node;
}




function treeDepth(root){

    let deepest = -1;

    function recursiveTest(current_block, current_depth){

        if(current_block.children.length != 0){
            for(let i = 0; i < current_block.children.length; i++){
                recursiveTest(current_block.children[i], current_depth + 1);
            }
        }

        else if(current_depth > deepest){
            deepest = current_depth;
        }
    }

    recursiveTest(root, 0);

    return deepest;
}





































// 
async function tryRandomNonce(previous_hash, message, target) {


    let result = null;

    // Not very efficient to go from Uint32Array to arraybuffer to string,
    // but crypto.getRandomValues needs a typed array
    // could also rename function to return hex string
    let nonce = buf2HexString(random32bitNonce().buffer);

    const digest = await hashString(previous_hash + message + nonce);

    if (testProofOfWork(digest, target)) {

        result = new Block();

        result.previous_hash = previous_hash;
        result.message = message;
        result.nonce = nonce;
        result.hash = buf2HexString(digest);
    }

    return result;
}






/**
 * Returns a 256Bit ArrayBuffer representing a number that is one larger than the largest binary number with the given number of leading zeroes
 * 
 * @param {int} num_leading_zeroes range from 1-256, 
 */
function create256BitTargetBuffer(num_leading_zeroes) {

    // could clamp here to ensure range

    let buf = new ArrayBuffer(32); // 32 bytes

    let view = new Uint8Array(buf);

    // From what I can tell you cant directly flip a single bit in an array buffer, need to operate in chunks of the given TypedArray
    let uint8_index = Math.floor((num_leading_zeroes - 1) / 8);

    // index of bit to flip in the uint8 chunk, from left to right
    let bit_index = Math.floor((num_leading_zeroes - 1) % 8);

    view[uint8_index] = Math.pow(2, 7 - bit_index);

    return view.buffer;
}






function logBufferUint8(buf) {
    let view = new Uint8Array(buf);
    console.log(view);
}

function buf2HexString(buf) {

    let result = '';

    let view = new Uint8Array(buf);

    for (let i = 0; i < view.length; i++) {
        result += view[i].toString(16).padStart(2, '0');
    }

    return result;
}




let TARGET = create256BitTargetBuffer(16);

// Origin block
let Origin = new Block();
Origin.previous_hash = '';
Origin.nonce = '1234';
Origin.data = 'hello world';

let A = new User();
A.name = 'Alfonso';
A.target_block = Origin;
A.updateDOMproperties();
document.body.appendChild(A.DOM_element);
A.chain_origin = Origin;


let B = new User();
B.name = "Bert";
B.target_block = Origin;
B.updateDOMproperties();
document.body.appendChild(B.DOM_element);
B.chain_origin = Origin;




let p = hashString(Origin.getHeader());

p.then(

    result => {
        Origin.createHashString(result);

        A.startMining();
        B.startMining();

    },

    error => {
        console.log('error hashing the origin block: ' + error);
    }
);








//------------------------------RENDERING-----------------------------------------------



let canvas = document.getElementById('blockchain-canvas');
let ctx = canvas.getContext('2d');



// This function can probably be improved a lot , could fix later or scrap
function drawTree(context, root){

    let max_depth = treeDepth(root);   


    context.clearRect(0, 0, canvas.width, canvas.height);

    // draw this
    // draw a line to children

    function recursiveDraw(current_node, depth, num_blocks_on_row, current_index, parent_width, total_canvas_offset){


        let vertical_position = (depth/max_depth) * (canvas.height - 20);


        let horizontal_multiplier = (current_index/(num_blocks_on_row + 1));
        let horizontal_position = (horizontal_multiplier * parent_width) + total_canvas_offset; 

        context.beginPath();
        context.rect(horizontal_position, vertical_position, 20, 20);
        context.stroke();

        // The children array should always be initialized to empty
        for(let i = 0; i < current_node.children.length; i++){
            
            recursiveDraw(
                current_node.children[i],
                depth + 1,
                current_node.children.length,
                i + 1, // reason for this explain
                (1/num_blocks_on_row) * parent_width,
                (current_index - 1) * (1/num_blocks_on_row) * parent_width + total_canvas_offset
            );
            
        }


    }

    recursiveDraw(root, 0, 1, 1, canvas.width - 20, 0);

}


let test_root = new Block();
let a1 = new Block();
let b1 = new Block();
let c1 = new Block();
let a21 = new Block();
let a22 = new Block();
let b2 = new Block();
let c21 = new Block();
let c22 = new Block();
let c23 = new Block();
let a31 = new Block();
let a32 = new Block();


test_root.addChild(a1);
test_root.addChild(b1);
test_root.addChild(c1);

a1.addChild(a21);
a1.addChild(a22);

b1.addChild(b2);

c1.addChild(c21);
c1.addChild(c22);
c1.addChild(c23);

a21.addChild(a31);
a21.addChild(a32);

drawTree(ctx, test_root);





























//-------------------------------------------------------------------------------------




































let ECDSA_obj = {
    name: "ECDSA",
    namedCurve: "P-384"
}

const key_pair1 = SC.generateKey(ECDSA_obj, true, ["sign", "verify"]);

key_pair1.then((key) => {

    exportCryptoKey(key.publicKey);
});

async function exportCryptoKey(key) {
    const exported = await SC.exportKey("raw", key);
    const exportedKeyBuffer = new Uint8Array(exported);
    //console.log(exportedKeyBuffer);
}