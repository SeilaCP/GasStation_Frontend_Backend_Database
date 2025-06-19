import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";

import CustomerList from "./component/CustomerList";

function App() {
  return (
    <BrowserRouter>
      <header>
        <h1>Article App</h1>
      </header>
      <Routes>
        <Route path="/" element={<CustomerList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;