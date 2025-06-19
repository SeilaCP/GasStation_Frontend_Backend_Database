const {Router} = require('express');
const CustomerControllers = require('../controllers/CustomerControllers');

const customerRouter = Router();
customerRouter.get('/', CustomerControllers.getcustomer);
customerRouter.get('/:id', CustomerControllers.getcustomerById);

module.exports = customerRouter;