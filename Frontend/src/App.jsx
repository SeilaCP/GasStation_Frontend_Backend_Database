import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";

import CustomerList from "./component/CustomerList";
import Home from "./component/homePage";
import { Header, Footer} from "./component/ui/header";
import ProductPage from "./component/productPage";
import { AddProduct } from "./component/addProduct";

function App() {
  return (
    <BrowserRouter>
      {/* <header>
        <Header />
      </header> */}
      <Routes>
        <Route path="/" element={<CustomerList />} />
        <Route path="/home" element={<Home />} />
        <Route path="/products" element={<ProductPage />} />
        <Route path="/add" element={<AddProduct />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;