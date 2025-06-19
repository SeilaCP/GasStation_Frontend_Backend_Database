const pool = require('../utils/database');

// get all customers
const getcustomer = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customer');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

// get customer by id
const getcustomerById = async (req, res) => {
  const customerId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM customer WHERE customer_id = $1', [customerId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Customer not found');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
}

module.exports = {
  getcustomer,
  getcustomerById
};