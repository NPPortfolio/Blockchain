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


/**
 * // Origin block
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
 * 
 */