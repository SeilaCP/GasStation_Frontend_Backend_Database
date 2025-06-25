import { useState, useEffect, useCallback, use } from 'react';
import { Link } from 'react-router-dom';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { createProduct } from '../services/fakeApi';

export const AddProduct = () => {
    const [newProductName, setNewProductName] = useState('');
    const [newProductQuantity, setNewProductQuantity] = useState('');
    const [newProductExpDate, setNewProductExpDate] = useState(''); // YYYY-MM-DD
    const [product, setProduct] = useState({});

    const [data, setData] = useState('');
    const [scanning, setScanning] = useState(true); // Control scanning state


    useEffect(() => {
        createProduct(product);
    }, [product]);

    const handleAddProduct = () => {
        setProduct({
            name: String(newProductName),
            price: 2.99,
            category: "Dairy",
            stock: newProductQuantity,
            barcode: String(data),
        });

        setNewProductName('');
        setNewProductQuantity('');
        setNewProductExpDate('');
        setData('');
        setScanning(false);
    };

  const handleUpdate = (err, result) => {
    if (result) {
      setData(result.text);
      setScanning(false); // Stop scanning after a successful read
    } else {
      setData('No barcode detected');
    }
  };

  const handleError = (error) => {
    console.error("Camera error:", error);
    if (error.name === "NotAllowedError") {
      alert("Camera access denied. Please allow camera access to scan barcodes.");
    }
  };
    return(
        <>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                <h3 className="text-2xl font-bold text-blue-700 mb-4">Add New Product</h3>
                <div className="mb-4">
                <label htmlFor="add-product-name" className="block text-gray-700 text-sm font-bold mb-2">Product Name:</label>
                <input
                    type="text"
                    id="add-product-name"
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    required
                />
                </div>
                <div className="mb-4">
                <label htmlFor="add-product-quantity" className="block text-gray-700 text-sm font-bold mb-2">Quantity:</label>
                <input
                    type="number"
                    id="add-product-quantity"
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newProductQuantity}
                    onChange={(e) => setNewProductQuantity(e.target.value)}
                    min="0"
                    required
                />
                </div>
                <div className="mb-6">
                <label htmlFor="add-product-exp-date" className="block text-gray-700 text-sm font-bold mb-2">Expiration Date:</label>
                <input
                    type="date"
                    id="add-product-exp-date"
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newProductExpDate}
                    onChange={(e) => setNewProductExpDate(e.target.value)}
                    required
                />
                </div>

                {/* Scan Barcode */}
                <div className="mb-6">
                <label htmlFor="add-product-exp-date" className="block text-gray-700 text-sm font-bold mb-2">Scan:</label>
                <div className="flex justify-center">
                    {scanning ? (
                    <BarcodeScannerComponent
                    width={250}
                    height={250}
                    onUpdate={handleUpdate}
                    onError={handleError}
                    facingMode="environment" // Use rear camera if available, otherwise front
                    stopStream={!scanning} // Crucial for preventing browser freeze on unmount/stop
                    />
                    ) : (
                    <div>
                    <p>Scanned Barcode: <strong>{data}</strong></p>
                    <button className="bg-white rounded-xl shadow-lg p-3 w-full max-w-md hover:bg-gray-200 transition" onClick={() => setScanning(true) }>Scan Again</button>
                    </div>
                    )}
                </div>
                </div>

                <div className="flex justify-end gap-3">
                <Link to="/products">
                <button
                    // onClick={closeModal}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                    Cancel
                </button>
                </Link>
                <Link to="/products">
                    <button
                        onClick={handleAddProduct}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                    >
                        Add Product
                    </button>
                </Link>
                </div>
            </div>
            </div>
        </>
    );
}