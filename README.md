# Blockchain

## Important Notes
In Progress note: This is written like the basic project is fully complete and documented which it isn't right now

The main reason I started working on this project was to learn more about the blockchain and cryptocurrencies. I wasn't sure what exactly to use them for in a portfolio project, but wanted to have the basics written in code as I learned. After working through the specifics of implementing a blockchain and currency with transactions, I'm deciding to either stop or halt the project (depending on whether I come back to it) as just a basic implementation.

In terms of blockchain technology there is a lot more to implement, but many of these I would rather just read about than put into code. Whether it is because they are a lot more involved work, deal with another complicated field (especially distributed systems to deal with forks, the UTXO database, propagating transactions and all that), or don't translate well into a personal portfolio project (advancements other people have done that are good to know about etc.), I've decided to leave them out for now.

That being said, one thing this project can do if it doesn't do anything that interesting with cryptocurrency is emphasize code quality and documentation, something the first project is lacking. To help with this I cut down on a lot of code that I started to implement that are either in the category above (multiple users handling mining results, forks in the chain as a tree) or are related to user interaction in the window that is harder to test and document.

This trimming down means that the only thing that will be seen on the portfolio page is an html rendering of the blockchain in a certain state that I've constructed in the main app.js. This could become something like a basic viewer that shows a blockchain in a state in a readable way, but again to go further with this idea would require a lot more things like testing environments, or ways for the user to manually change parts of the transactions or blocks to see how they are invalidated or validated. These are useful things, but I would rather continue and work on some other projects than spend too much time on features.

# Notes List: things that aren't implemented but need to be considered

- Asynchronous Safety - The utxo database, mining the right block in the chain, adding transactions to blocks
- Privacy - There are no measures to prevent the reuse of public key hashes, transaction history can be pieced together and much more


# Transactions

I got hung up on this part of the project for a little while, but managed to piece together what I think is a simplified version of the UTXO model that bitcoin uses. There might be something I overlooked here in terms of signing transactions and hashing transaction ids, more info below.

A few of the important sources of info I used:

https://medium.com/@blairlmarshall/how-does-a-bitcoin-transaction-actually-work-1c44818c3996

General structure of the transaction, most importantly what data is signed - 

"The signature is a Digital Signature, as discussed above, where the ‘data’ corresponds to essentially the entire transaction you are creating for Sarah. Specifically, the data refers to the transaction ID, index, Tom’s PubKey Script, your new PubKey Script for Sarah and the amount of satoshis you are sending Sarah... This (hash) combined with your public key makes up the Signature Script"

https://bitcoin.stackexchange.com/questions/3374/how-to-redeem-a-basic-tx

The format to follow when dealing with transactions as raw hex data. The version in this project is simplified to not have the version field, scriptSig length and outputScript length (because it will always be a set length pub key and signature when restricted to only P2PKH transactions), sequence, lock time (might add later), and the hash code type (I think I just used SIGHASH_ALL)

https://bitcoin.stackexchange.com/questions/32305/how-does-the-ecdsa-verification-algorithm-work-during-transaction/32308#32308

Loosely used for verifying transactions

## Notes

The above sources were good information about the structure of a transacion, but I am not entirely sure that the signing, hashing, and verifying processes are done according to the bitcoin protocol. From my understanding of the above sources when you sign the transaction data when first creating it, you do so by replacing the signature and public key side of the key pair used to make the signature (scriptSig in bitcoin) with the utxo public key hashes (pubKeyScript in bitcoin). Once you've signed that raw data, you put the signature and public key back into the transaction to get the final transaction data. This final transaction data is hashed to create the unique transaction ID.

This means that when verifying a transaction, in the input verification, you need to recreate the raw transaction data based on the UTXOs of the given inputs. This recreated raw transaction is hashed, and is used to verify the signatures of the final transaction, because that hash is the data that was signed in the creation of the transaction.

One problem with this is that the raw transaction data contains the pubKeyScripts of the utxos specified by the inputs. So to recreate the raw data you need to obtain the UTXO identified by the previous transaction ID and the index. This means that the small current UTXO database is not enough information to store to always be able to verify a transaction, and a database of all spent transactions is needed too if you want to verify that an old transaction is valid.


Things that pop up from restricting to P2PKH - In a transaction, each output to the same pub key will have the same scriptSig (They all sign the same raw tx data) ?? might be wrong more testing to do

No merkle trees, only concatenation of transaction hashes hashed

no forks

Note about downsides of using javascript