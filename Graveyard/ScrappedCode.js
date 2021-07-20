// recursive functions on the blockchain
/**
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
}*/






// mouse handling for the canvas
/**
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

}*/







// Tree testing
/**
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
*/