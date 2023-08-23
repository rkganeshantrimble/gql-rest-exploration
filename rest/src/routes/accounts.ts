import express from 'express';
import { getAccountDataByAccountId } from '../controllers/accounts';
// import { getAccountData } from '../services/profileService.js';
// const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require("../controllers/product");
const router = express.Router();
router.get('/:accountId', getAccountDataByAccountId);

// module.exports = router;

export default router;
