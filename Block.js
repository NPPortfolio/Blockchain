class Block {

    constructor() {


        // According to lecture notes block doesnt contain hash of itself look into
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

    async createHash(){
        this.hash = hashBuffer(UTF16toBUF(this.getHeader()));
    }

    addChild(block) {

        this.children.push(block);
    }


    logTree() {
        this.log();
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].logTree();
        }
    }

    customJSONString(){
        return JSON.stringify(this,
            [
                'hash',
                'previous_hash',
                'message',
                'nonce',

            ], 4);
    }
}