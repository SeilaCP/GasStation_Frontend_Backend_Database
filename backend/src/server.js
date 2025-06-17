const express = require('express');
const CustomerControllers = require('./controllers/CustomerControllers');
const port = 3000;

const app = express();
app.use(express.json());

app.get('/customers', CustomerControllers.getcustomer);


app.get('/customers/:id', CustomerControllers.getcustomerById);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
