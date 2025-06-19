import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getcustomer, getcustomerById } from "../services/customerApi";

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getcustomer(); // data from dvdrental.customer
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

//   const handleCustomerClick = async (id) => {
//     try {
//       const customer = await getcustomerById(id);
//       navigate(`/customers/${id}`, { state: { customer } });
//     } catch (error) {
//       console.error("Error fetching customer by ID:", error);
//     }
//   };

  return (
    <div>
      <h1>Customer List</h1>
      <ul>
        {customers.map((customer) => (
          <li
            key={customer.customer_id}
            // onClick={() => handleCustomerClick(customer.customer_id)}
            // hello
            style={{ cursor: "pointer", margin: "8px 0" }}
          >
            {customer.first_name} {customer.last_name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CustomerList;
