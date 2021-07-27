class Block {

    constructor() {


        // According to lecture notes block doesnt contain hash of itself look into
        this.hash = '';

        // Contents that are hashed
        this.previous_hash = '';
        this.message = '';
        this.nonce = '';
    }

    // This is the data that is hashed to give each block a unique hash, can add more stuff to it as I go
    getHeader() {
        return this.previous_hash + this.message + this.nonce;
    }

    getHashString() {
        return this.hash;
    }

    async createHash() {
        this.hash = BUFtoHEX(await hashBuffer(UTF16toBUF(this.getHeader())));
    }

    HTMLString() {

        let x =

            '<div class = \'Block\'>' +
            '<p>Hash: ' + this.hash + '</p>' +
            '<p>Previous Hash: ' + this.previous_hash + '</p>' +
            '<p>Transactions Concat Hash: ' + this.message + '</p>' + // to be changed
            '<p>Nonce: ' + this.nonce + '</p>' +
            '</div>'

            ;

        return x;
    }
}