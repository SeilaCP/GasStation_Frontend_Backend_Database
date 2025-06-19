const express = require('express');
const customerRouter = require('./routes/CustomerRoutes');  
const port = 3000;

const app = express();
app.use(express.json());

app.use('/customers', customerRouter);
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
