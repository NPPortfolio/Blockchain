// testing 
let block_list = [];

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
        this.mine();
    }

    stopMining() {
        this.should_mine = false;
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
            block_list.push(result);
            drawTree(this.chain_origin);

            // not optimized
            this.target_block = findDeepestNode(this.chain_origin);
            this.mine();
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
                return result;
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


        if (current_depth > max_level) {
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




function treeDepth(root) {

    let deepest = -1;

    function recursiveTest(current_block, current_depth) {

        if (current_block.children.length != 0) {
            for (let i = 0; i < current_block.children.length; i++) {
                recursiveTest(current_block.children[i], current_depth + 1);
            }
        }

        else if (current_depth > deepest) {
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
    let nonce = BUFtoHEX(random32bitNonce().buffer);

    const digest = await hashUTF16String(previous_hash + message + nonce);

    if (testProofOfWork(digest, target)) {

        result = new Block();

        result.previous_hash = previous_hash;
        result.message = message;
        result.nonce = nonce;
        result.hash = BUFtoHEX(digest);
    }

    return result;
}






function logBufferUint8(buf) {
    let view = new Uint8Array(buf);
    console.log(view);
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
A.chain_origin = Origin;


let B = new User();
B.name = "Bert";
B.target_block = Origin;
B.chain_origin = Origin;




let p = hashUTF16String(Origin.getHeader());

p.then(

    result => {
        Origin.createHashString(result);

        block_list.push(Origin);
        drawTree(Origin);

        //A.startMining();
        //B.startMining();

    },

    error => {
        console.log('error hashing the origin block: ' + error);
    }
);






//------------------------------RENDERING-----------------------------------------------

// I think I'm going to get rid of all of this and use html elements instead

let gl = createGLContext("blockchain-canvas");



// testing
const UI_SQUARE_CLIP_SIZE = 0.05;



function drawTree(root) {



    let gl_data = createInstancedSquaresFromTree(root);


    gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gl_data.translations), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gl_data.colors), gl.DYNAMIC_DRAW);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArraysInstanced(gl.LINE_LOOP, 0, 4, gl_data.translations.length / 2);

    /**
    * 
    * TODO: rewrite or fix this function with a much better tree drawing algorithm
    * 
    * 
    * 
    * This function creates the clip space translations (and colors, todo remove) for a given tree root
    * The root clip space coordiantes are (0.5, 1), centered at the top of the clip space
    * The algorithm then recursively calculates the children node translations to fit them to the clip space
    * 
    * Each child can only take up the space that is allocated to its parent based on the number of siblings a parent has,
    * which is not ideal and something to fix with a better tree drawing algorithm in the future
    * --right now this is mostly used for debugging
    */
    function createInstancedSquaresFromTree(root) {

        let max_depth = treeDepth(root);

        // draw this
        // draw a line to children

        let translations = [];
        let colors = [];

        function recursiveDraw(current_node, depth, num_blocks_on_row, current_index, parent_width_fraction, total_canvas_offset) {


            // clip space
            let vertical_position = -(2 - UI_SQUARE_CLIP_SIZE) * (depth / max_depth) + 1;

            // also should have ui square clip size for horizontal, debug function for now
            let horizontal_multiplier = (current_index / (num_blocks_on_row + 1));

            // This is between 0 and 1;
            let x = (horizontal_multiplier * parent_width_fraction) + total_canvas_offset;

            // This is in clip coordinates, from -1 to 1;
            let horizontal_position = 2 * x - 1;

            // question here about functional programming, shouldn't have any changes, could fix
            current_node.nd_coords = [horizontal_position, vertical_position];

            translations.push(horizontal_position, vertical_position);
            colors.push(0, 1, 1, 1);

            // The children array should always be initialized to empty
            for (let i = 0; i < current_node.children.length; i++) {


                recursiveDraw(
                    current_node.children[i],
                    depth + 1,
                    current_node.children.length,
                    i + 1, // reason for this explain
                    (1 / num_blocks_on_row) * parent_width_fraction,
                    (current_index - 1) * (1 / num_blocks_on_row) * parent_width_fraction + total_canvas_offset
                );

            }


        }

        recursiveDraw(root, 0, 1, 1, 1, 0);


        return {
            translations: translations,
            colors: colors
        }

    }
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

//let block_list = [test_root, a1, b1, c1, a21, a22, b2, c21, c22, c23, a31, a32];


test_root.addChild(a1);
test_root.addChild(b1);
test_root.addChild(c1);
test_root.message = "json testing";

a1.addChild(a21);
a1.addChild(a22);

b1.addChild(b2);

c1.addChild(c21);
c1.addChild(c22);
c1.addChild(c23);

a21.addChild(a31);
a21.addChild(a32);

//////////////////////////////////////////////////////////////////////////////////////

const program = initShaderProgram(gl, vsSource, fsSource);

gl.useProgram(program);

// Create locations and buffers
const positionLoc = gl.getAttribLocation(program, 'a_position');
const translationLoc = gl.getAttribLocation(program, 'translation');
const colorLoc = gl.getAttribLocation(program, 'color');

const positionBuffer = gl.createBuffer();
const translationBuffer = gl.createBuffer();
const colorBuffer = gl.createBuffer();

// Set the parameters for each attribute
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, translationBuffer);
gl.enableVertexAttribArray(translationLoc);
gl.vertexAttribPointer(translationLoc, 2, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.enableVertexAttribArray(colorLoc);
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);

gl.vertexAttribDivisor(translationLoc, 1);
gl.vertexAttribDivisor(colorLoc, 1);

// Buffer data that is not decided at runtime
const square_vertices = new Float32Array([0, 0, UI_SQUARE_CLIP_SIZE, 0, UI_SQUARE_CLIP_SIZE, -UI_SQUARE_CLIP_SIZE, 0, -UI_SQUARE_CLIP_SIZE]);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, square_vertices, gl.STATIC_DRAW);



//drawTree(test_root);







function mouseHandler(e) {

    let canvas = document.getElementById('blockchain-canvas');

    let rect = canvas.getBoundingClientRect();

    let ndc_x = ((2 * (e.clientX - rect.left)) / rect.width) - 1;
    let ndc_y = - (((2 * (e.clientY - rect.top)) / rect.height) - 1);

    for (let i = 0; i < block_list.length; i++) {
        if (isMouseOverBlock(ndc_x, ndc_y, block_list[i], UI_SQUARE_CLIP_SIZE)) {
            // warning, this does this every time the mouse is moved over the block, could fix if performance matters
            document.getElementById('json-window').innerHTML = block_list[i].customJSONString();
        }
    }
}



function isMouseOverBlock(mouse_ndx, mouse_ndy, block, ui_clip_size) {

    let left_wall = block.nd_coords[0];
    let right_wall = block.nd_coords[0] + ui_clip_size;
    let top = block.nd_coords[1];
    let bottom = block.nd_coords[1] - ui_clip_size;

    if (mouse_ndx >= left_wall && mouse_ndx <= right_wall) {
        if (mouse_ndy >= bottom && mouse_ndy <= top) {
            return true;
        }
    }

    return false;

}