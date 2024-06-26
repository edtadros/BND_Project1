/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii');
// Logging added per code review recommendation//
const logger = require('./logger.js');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        logger.info('blockchain.initializeChain called');
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            // Log the entire blockchain after initialization
            logger.info("Blockchain after initialization: ", JSON.stringify(this.chain));
            await this._addBlock(block);
            // Log the entire blockchain after adding a block
            logger.info("Blockchain after adding a block: ", JSON.stringify(this.chain));
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        logger.info('blockchain.getChainHeight called');
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        logger.info('blockchain._addBlock called');
        let self = this;
        return new Promise(async (resolve, reject) => {
            try{
                if(self.chain.length >0){
                    block.previousBlockHash = self.chain[self.chain.length - 1].hash;
                }
                block.time = new Date().getTime().toString().slice(0,-3);
                block.height = self.chain.length;
                block.hash = SHA256(JSON.stringify(block)).toString();
                self.chain.push(block);
                self.height++;

                // Validate the chain after adding a block
                const errors = await self.validateChain();
                if(errors && errors.length > 0){
                    reject(errors);
                }
                // Log the block data and height
                logger.info("Block added: " + hex2ascii(block.body));
                logger.info("Block height: " + block.height);
                resolve(block);
            } catch (error){
                // Add Block Error
                logger.error("Error occurred while adding block:", error);
                reject(error);
            }
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        logger.info('blockchain.requestMessageOwnershipVerification called');
        return new Promise((resolve) => {
            let message = `${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`;
            resolve(message);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    /* submitStar(address, message, signature, star) {
        logger.info('blockchain.submitStar called');
        let self = this;
        return new Promise(async (resolve, reject) => {
            const messageTime = parseInt(message.split(':')[1]);
            const currentTime = parseInt(new Date().getTime().toString().slice(0,-3));
            if((currentTime - messageTime) < 300){
                if(bitcoinMessage.verify(message, address, signature)){
                    const block = new BlockClass.Block({owner: address, star: star});
                    await self._addBlock(block);
                    resolve(block);
                } else {
                    reject(new Error("Signature verification failed."));
                }
            } else {
                reject(new Error("Message signature has expired."));
            }
        });
    } */

    submitStar(address, message, signature, star) {
        logger.info('blockchain.submitStar called');
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                const messageTime = parseInt(message.split(':')[1]);
                const currentTime = parseInt(new Date().getTime().toString().slice(0,-3));
                if((currentTime - messageTime) < 300){
                    logger.info(`Verifying signature. Message: ${message}, Address: ${address}, Signature: ${signature}`);
                    if(bitcoinMessage.verify(message, address, signature)){
                        const block = new BlockClass.Block({owner: address, star: star});
                        await self._addBlock(block);
                        resolve(block);
                    } else {
                        reject(new Error("Signature verification failed."));
                    }
                } else {
                    reject(new Error("Message signature has expired."));
                }
            } catch (error) {
                logger.error('Error in submitStar: ', error);
                reject(error);
            }
        });
    }
    
    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        logger.info('blockchain.getBlockByHash called');
        let self = this;
        return new Promise((resolve, reject) => {
           const block = self.chain.find(p => p.hash === hash);
           resolve(block || null)
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        logger.info('blockchain.getBlockByHeight called');
        let self = this;
        return new Promise((resolve, reject) => {
            const block = self.chain.find(p => p.height === height);
            resolve(block || null)
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress (address) {
        logger.info('blockchain.getStarsByWalletAddress called');
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            let stars = self.chain
                .map(block => {
                    // decode the block data
                    let decodedData = JSON.parse(hex2ascii(block.body));

                    // if the block owner exists and matches the address return the star data
                    if(decodedData.owner && decodedData.owner === address){
                        return decodedData.star;
                    }
                })
                // filter out blocks that don't match the owner
                .filter(star => star !== undefined);
            if(stars.length > 0){
                resolve(stars);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validate`
     * 2. Each Block should check the with the previousBlockHash
     */
    async validateChain() {
        logger.info('blockchain.validateChain called');
        let self = this;
        let errorLog = [];

        // Create an array of promises for validating each block in the chain
        const promises = self.chain.map((block, i) => {
            return block.validate().then(isValid => {
                // Check block is valid
                if (!isValid) {
                    errorLog.push({ block: i, error: 'Block validation failed' });
                }

                // Check previous block hash matches excluding genesis block
                if (i > 0 && block.previousBlockHash !== self.chain[i - 1].hash) {
                    errorLog.push({ block: i, error: "Previous block hash mismatch" });
                }
            });
        });

        // Use Promise.all to wait for all the promises to resolve
        await Promise.all(promises);
        return errorLog;
    }

}

module.exports.Blockchain = Blockchain;   