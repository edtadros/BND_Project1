/**
 *          BlockchainController
 * 
 * This class expose the endpoints that the client applications will use to interact with the 
 * Blockchain dataset
 */

const logger = require('./src/logger.js');

class BlockchainController {

    //The constructor receive the instance of the express.js app and the Blockchain class
    constructor(app, blockchainObj) {
        this.app = app;
        this.blockchain = blockchainObj;
        // All the endpoints methods needs to be called in the constructor to initialize the route.
        this.getBlockByHeight();
        this.requestOwnership();
        this.submitStar();
        this.getBlockByHash();
        this.getStarsByOwner();
        this.validateChain();
    }

    // Enpoint to Get a Block by Height (GET Endpoint)
    getBlockByHeight() {
        this.app.get("/block/height/:height", async (req, res) => {
            if(req.params.height) {
                const height = parseInt(req.params.height);
                let block = await this.blockchain.getBlockByHeight(height);
                if(block){
                    return res.status(200).json(block);
                } else {
                    return res.status(404).send("Block Not Found!");
                }
            } else {
                return res.status(404).send("Block Not Found! Review the Parameters!");
            }
            
        });
    }

    // Endpoint that allows user to request Ownership of a Wallet address (POST Endpoint)
    requestOwnership() {
        this.app.post("/requestValidation", async (req, res) => {
            if(req.body.address) {
                const address = req.body.address;
                const message = await this.blockchain.requestMessageOwnershipVerification(address);
                if(message){
                    return res.status(200).json(message);
                } else {
                    return res.status(500).send("An error happened!");
                }
            } else {
                return res.status(500).send("Check the Body Parameter!");
            }
        });
    }

    // Endpoint that allow Submit a Star, you need first to `requestOwnership` to have the message (POST endpoint)
    submitStar() {
        this.app.post("/submitstar", async (req, res) => {
            logger.info('submitStar endpoint called');
            if(req.body.address && req.body.message && req.body.signature && req.body.star) {
                const address = req.body.address;
                const message = req.body.message;
                const signature = req.body.signature;
                const star = req.body.star;
                logger.info(`Received data: address=${address}, message=${message}, signature=${signature}, star=${JSON.stringify(star)}`);
                try {
                    logger.info('Attempting to submit star');
                    let block = await this.blockchain.submitStar(address, message, signature, star);
                    if(block){
                        logger.info('Star submitted successfully');
                        return res.status(200).json(block);
                    } else {
                        logger.error('An error occurred while submitting star');
                        return res.status(500).send("An error happened!");
                    }
                } catch (error) {
                    logger.error('Exception caught in submitStar: ', error);
                    return res.status(500).send(error);
                }
            } else {
                logger.error('Invalid request body in submitStar');
                return res.status(500).send("Check the Body Parameter!");
            }
        });
    }

    // This endpoint allows you to retrieve the block by hash (GET endpoint)
    getBlockByHash() {
        this.app.get("/block/hash/:hash", async (req, res) => {
            if(req.params.hash) {
                const hash = req.params.hash;
                let block = await this.blockchain.getBlockByHash(hash);
                if(block){
                    return res.status(200).json(block);
                } else {
                    return res.status(404).send("Block Not Found!");
                }
            } else {
                return res.status(404).send("Block Not Found! Review the Parameters!");
            }
            
        });
    }

    // This endpoint allows you to request the list of Stars registered by an owner (GET endpoint)
    getStarsByOwner() {
        this.app.get("/blocks/:address", async (req, res) => {
            if(req.params.address) {
                const address = req.params.address;
                try {
                    let stars = await this.blockchain.getStarsByWalletAddress(address);
                    if(stars){
                        return res.status(200).json(stars);
                    } else {
                        return res.status(404).send("Block Not Found!");
                    }
                } catch (error) {
                    return res.status(500).send("An error happened!");
                }
            } else {
                return res.status(500).send("Block Not Found! Review the Parameters!");
            }
            
        });
    }

    // This endpoint validates the entire blockchain (GET endpoint)
    validateChain() {
        this.app.get("/validateChain", async (req, res) => {
            try {
                const errors = await this.blockchain.validateChain();
                return res.status(200).json({ errors: errors });
            } catch (error) {
                return res.status(500).json({ error: error.message });
            }
        });
    }

}

module.exports = (app, blockchainObj) => { return new BlockchainController(app, blockchainObj);}