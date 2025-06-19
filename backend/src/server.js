const express = require('express');
const cors = require('cors');
const customerRouter = require('./routes/CustomerRoutes');  
const port = 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.use('/customers', customerRouter);
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
