# Blockchain
Undecided blockchain app

In progress blockchain app, if anyone is checking this because of the code quality message on the main portfolio page
the buffer.js and crypto.js are the only two files documented so far, more to come.



## Transactions

I got hung up on this part of the project for a little while, but managed to piece together what I think is a simplified version of the UTXO model that bitcoin uses. A few of the important sources of info I used are listed below:

https://medium.com/@blairlmarshall/how-does-a-bitcoin-transaction-actually-work-1c44818c3996

General structure of the transaction, most importantly what data is signed

"The signature is a Digital Signature, as discussed above, where the ‘data’ corresponds to essentially the entire transaction you are creating for Sarah. Specifically, the data refers to the transaction ID, index, Tom’s PubKey Script, your new PubKey Script for Sarah and the amount of satoshis you are sending Sarah... This (hash) combined with your public key makes up the Signature Script"

https://bitcoin.stackexchange.com/questions/3374/how-to-redeem-a-basic-tx

The format to follow when dealing with transactions as raw hex data. The version in this project is simplified to not have the version field, scriptSig and outputScript length (because it will always be a set length pub key and signature when restricted to only P2PKH transactions), sequence, lock time (might add later), and the hash code type (I think I just used SIGHASH_ALL)

https://bitcoin.stackexchange.com/questions/32305/how-does-the-ecdsa-verification-algorithm-work-during-transaction/32308#32308

Loosely used for verifying transactions



## Notes
Things that pop up from restricting to P2PKH:

Notes about needing to pass around the UTXODB and keep track of unspent UTXOs

No merkle trees, only concatenation of transaction hashes hashed

no forks