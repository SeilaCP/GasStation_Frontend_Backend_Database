import React, { useState, useEffect, useCallback } from 'react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';

function Home() {
  // Firebase and Authentication State
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Application Data States
  const [products, setProducts] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  // UI State for Forms/Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);

  // Form Input States
  const [newProductName, setNewProductName] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState('');
  const [newProductExpDate, setNewProductExpDate] = useState(''); // YYYY-MM-DD

  const [editProductName, setEditProductName] = useState('');
  const [editProductQuantity, setEditProductQuantity] = useState('');
  const [editProductExpDate, setEditProductExpDate] = useState('');

  // Helper for displaying messages
  const [message, setMessage] = useState('');

  // Initialize Firebase and set up authentication listener
  useEffect(() => {
    try {
      // Access global variables provided by the Canvas environment
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
      const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

      if (!firebaseConfig.apiKey) {
        console.error("Firebase configuration is missing. Please ensure __firebase_config is correctly set.");
        setMessage("Error: Firebase not configured. Please contact support.");
        return;
      }

      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestoreDb);
      setAuth(firebaseAuth);

      // Sign in with custom token if available, otherwise anonymously
      const signIn = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(firebaseAuth, initialAuthToken);
          } else {
            await signInAnonymously(firebaseAuth);
          }
          console.log("Firebase authentication successful.");
        } catch (error) {
          console.error("Error during Firebase sign-in:", error);
          setMessage(`Authentication Error: ${error.message}`);
        }
      };

      signIn();

      // Listen for auth state changes to set user ID
      const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("User UID:", user.uid);
        } else {
          setUserId(null);
          console.log("No user signed in.");
        }
        setIsAuthReady(true); // Mark auth as ready after initial check
      });

      // Cleanup subscription on unmount
      return () => unsubscribeAuth();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setMessage(`Initialization Error: ${error.message}`);
    }
  }, []); // Run once on component mount

  // Fetch products and activity log in real-time
  useEffect(() => {
    if (!db || !isAuthReady || !userId) {
      console.log("Firestore not ready or user not authenticated for data fetch.");
      return; // Wait for Firebase to be ready and user to be authenticated
    }

    // Set up real-time listener for products
    // Private data: /artifacts/{appId}/users/{userId}/products
    const productsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/products`);
    const unsubscribeProducts = onSnapshot(productsCollectionRef, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      console.log("Products fetched:", productsData.length);
    }, (error) => {
      console.error("Error fetching products:", error);
      setMessage(`Error fetching products: ${error.message}`);
    });

    // Set up real-time listener for activity log
    // Public data: /artifacts/{appId}/public/data/activityLog
    const activityLogCollectionRef = collection(db, `artifacts/${__app_id}/public/data/activityLog`);
    // Note: orderBy is commented out as it can cause index issues. Sort in memory if needed.
    const activityLogQuery = query(activityLogCollectionRef /*, orderBy('timestamp', 'desc') */);
    const unsubscribeActivityLog = onSnapshot(activityLogQuery, (snapshot) => {
      const logData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort the log data by timestamp in descending order in memory
      logData.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
      setActivityLog(logData);
      console.log("Activity log fetched:", logData.length);
    }, (error) => {
      console.error("Error fetching activity log:", error);
      setMessage(`Error fetching activity log: ${error.message}`);
    });

    // Cleanup subscriptions on unmount or when dependencies change
    return () => {
      unsubscribeProducts();
      unsubscribeActivityLog();
    };
  }, [db, isAuthReady, userId]); // Re-run if db, isAuthReady, or userId changes

  // Log user actions to Firestore
  const logUserAction = useCallback(async (actionDetails) => {
    if (!db || !userId) {
      console.error("Cannot log action: Firestore not initialized or user not authenticated.");
      return;
    }
    try {
      // Public data: /artifacts/{appId}/public/data/activityLog
      const activityLogCollectionRef = collection(db, `artifacts/${__app_id}/public/data/activityLog`);
      await addDoc(activityLogCollectionRef, {
        userId: userId,
        timestamp: serverTimestamp(),
        ...actionDetails,
      });
      console.log("User action logged:", actionDetails.actionType);
    } catch (error) {
      console.error("Error logging user action:", error);
      setMessage(`Error logging action: ${error.message}`);
    }
  }, [db, userId]);

  // Handle adding a new product
  const handleAddProduct = async () => {
    if (!db || !userId) {
      setMessage("Please wait for the system to initialize.");
      return;
    }
    if (!newProductName.trim() || newProductQuantity === '' || !newProductExpDate.trim()) {
      setMessage('Please fill in all product fields.');
      return;
    }
    const quantity = parseInt(newProductQuantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      setMessage('Quantity must be a non-negative number.');
      return;
    }

    try {
      const newProductData = {
        name: newProductName.trim(),
        quantity: quantity,
        expirationDate: newProductExpDate.trim(),
      };
      // Private data: /artifacts/{appId}/users/{userId}/products
      const productsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/products`);
      const docRef = await addDoc(productsCollectionRef, newProductData);

      // Log the action
      await logUserAction({
        actionType: 'insert',
        productId: docRef.id,
        productName: newProductData.name,
        newQuantity: newProductData.quantity,
        newExpirationDate: newProductData.expirationDate,
      });

      setMessage('Product added successfully!');
      setNewProductName('');
      setNewProductQuantity('');
      setNewProductExpDate('');
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding product:", error);
      setMessage(`Failed to add product: ${error.message}`);
    }
  };

  // Prepare for editing a product
  const handleEditClick = (product) => {
    setProductToEdit(product);
    setEditProductName(product.name);
    setEditProductQuantity(product.quantity.toString());
    setEditProductExpDate(product.expirationDate);
    setShowEditModal(true);
  };

  // Handle updating an existing product
  const handleUpdateProduct = async () => {
    if (!db || !userId || !productToEdit) {
      setMessage("System error, please refresh.");
      return;
    }
    if (!editProductName.trim() || editProductQuantity === '' || !editProductExpDate.trim()) {
      setMessage('Please fill in all fields for update.');
      return;
    }
    const quantity = parseInt(editProductQuantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      setMessage('Quantity must be a non-negative number.');
      return;
    }

    try {
      // Private data: /artifacts/{appId}/users/{userId}/products
      const productDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/products`, productToEdit.id);
      const oldProductData = { ...productToEdit }; // Copy current data for logging
      const updatedProductData = {
        name: editProductName.trim(),
        quantity: quantity,
        expirationDate: editProductExpDate.trim(),
      };
      await updateDoc(productDocRef, updatedProductData);

      // Log the action
      await logUserAction({
        actionType: 'update',
        productId: productToEdit.id,
        productName: oldProductData.name,
        oldQuantity: oldProductData.quantity,
        newQuantity: updatedProductData.quantity,
        oldExpirationDate: oldProductData.expirationDate,
        newExpirationDate: updatedProductData.expirationDate,
        changes: {
          name: oldProductData.name !== updatedProductData.name ? { old: oldProductData.name, new: updatedProductData.name } : undefined,
          quantity: oldProductData.quantity !== updatedProductData.quantity ? { old: oldProductData.quantity, new: updatedProductData.quantity } : undefined,
          expirationDate: oldProductData.expirationDate !== updatedProductData.expirationDate ? { old: oldProductData.expirationDate, new: updatedProductData.expirationDate } : undefined,
        }
      });

      setMessage('Product updated successfully!');
      setShowEditModal(false);
      setProductToEdit(null);
    } catch (error) {
      console.error("Error updating product:", error);
      setMessage(`Failed to update product: ${error.message}`);
    }
  };

  // Prepare for deleting a product
  const handleDeleteProductConfirm = (productId) => {
    setProductIdToDelete(productId);
    setShowConfirmDeleteModal(true);
  };

  // Handle deleting a product
  const handleDeleteProduct = async () => {
    if (!db || !userId || !productIdToDelete) {
      setMessage("System error, please refresh.");
      return;
    }
    try {
      // Find the product name for logging before deletion
      const productToDeleteData = products.find(p => p.id === productIdToDelete);
      const productNameForLog = productToDeleteData ? productToDeleteData.name : 'Unknown Product';
      const productQuantityForLog = productToDeleteData ? productToDeleteData.quantity : 'Unknown Quantity';
      const productExpDateForLog = productToDeleteData ? productToDeleteData.expirationDate : 'Unknown Date';

      // Private data: /artifacts/{appId}/users/{userId}/products
      const productDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/products`, productIdToDelete);
      await deleteDoc(productDocRef);

      // Log the action
      await logUserAction({
        actionType: 'delete',
        productId: productIdToDelete,
        productName: productNameForLog,
        oldQuantity: productQuantityForLog,
        oldExpirationDate: productExpDateForLog,
      });

      setMessage('Product deleted successfully!');
      setShowConfirmDeleteModal(false);
      setProductIdToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      setMessage(`Failed to delete product: ${error.message}`);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowConfirmDeleteModal(false);
    setProductToEdit(null);
    setProductIdToDelete(null);
    setMessage(''); // Clear messages on close
  };

  const getExpirationStatus = (expDateString) => {
    if (!expDateString) return 'No Date';
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

    const expirationDate = new Date(expDateString);
    expirationDate.setHours(0, 0, 0, 0); // Normalize expiration date to start of day

    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="font-semibold text-red-600">Expired ({Math.abs(diffDays)} days ago)</span>;
    } else if (diffDays <= 7) {
      return <span className="font-semibold text-orange-500">Expires soon ({diffDays} days)</span>;
    } else {
      return <span className="text-green-600">Valid</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col items-center p-4">
      
      <style>{`
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8 mb-8">
        <p className="text-center text-gray-600 mb-4">
          Manage your products, track quantities and expiration dates, and monitor all user activities.
        </p>

        {userId && (
          <p className="text-sm text-center text-gray-500 mb-6 p-2 bg-blue-50 rounded-lg">
            Logged in as User ID: <span className="font-mono break-all">{userId}</span>
          </p>
        )}

        {message && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <span className="block sm:inline">{message}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setMessage('')}>
              <svg className="fill-current h-6 w-6 text-blue-500 cursor-pointer" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.697l-2.651 2.652a1.2 1.2 0 1 1-1.697-1.697L8.303 10 5.651 7.348a1.2 1.2 0 1 1 1.697-1.697L10 8.303l2.651-2.652a1.2 1.2 0 1 1 1.697 1.697L11.697 10l2.652 2.651a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </span>
          </div>
        )}

        {/* Add Product Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out"
          >
            Add New Product
          </button>
        </div>

        {/* Products List Section */}
        <h2 className="text-2xl font-bold text-blue-700 mb-4 border-b pb-2">Your Products</h2>
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No products found. Add some to get started!</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white">
              <thead className="bg-blue-50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider rounded-tl-lg">Product Name</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Quantity</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Expiration Date</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-900">{product.name}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-900">{product.quantity}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-900">
                      {product.expirationDate} ({getExpirationStatus(product.expirationDate)})
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="text-blue-600 hover:text-blue-900 mr-3 transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProductConfirm(product.id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Log Section */}
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-blue-700 mb-4 border-b pb-2">Activity Log</h2>
        {activityLog.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No activities recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white">
              <thead className="bg-blue-50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider rounded-tl-lg">Timestamp</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">User ID</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider rounded-tr-lg">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activityLog.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-900">
                      {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-900 font-mono text-xs">{log.userId}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-900 capitalize">{log.actionType}</td>
                    <td className="py-3 px-4 text-gray-900">
                      {log.actionType === 'insert' && (
                        `Added '${log.productName}' with quantity ${log.newQuantity} and expiry ${log.newExpirationDate}.`
                      )}
                      {log.actionType === 'update' && (
                        `Updated '${log.productName || log.changes?.name?.old || 'Unknown'}' ` +
                        (log.changes?.quantity ? `quantity from ${log.changes.quantity.old} to ${log.changes.quantity.new}. ` : '') +
                        (log.changes?.expirationDate ? `expiry from ${log.changes.expirationDate.old} to ${log.changes.expirationDate.new}. ` : '') +
                        (log.changes?.name ? `name from '${log.changes.name.old}' to '${log.changes.name.new}'.` : '')
                      )}
                      {log.actionType === 'delete' && (
                        `Deleted '${log.productName}' (Quantity: ${log.oldQuantity}, Exp: ${log.oldExpirationDate}).`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
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
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && productToEdit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-blue-700 mb-4">Edit Product: {productToEdit.name}</h3>
            <div className="mb-4">
              <label htmlFor="edit-product-name" className="block text-gray-700 text-sm font-bold mb-2">Product Name:</label>
              <input
                type="text"
                id="edit-product-name"
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editProductName}
                onChange={(e) => setEditProductName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="edit-product-quantity" className="block text-gray-700 text-sm font-bold mb-2">Quantity:</label>
              <input
                type="number"
                id="edit-product-quantity"
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editProductQuantity}
                onChange={(e) => setEditProductQuantity(e.target.value)}
                min="0"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="edit-product-exp-date" className="block text-gray-700 text-sm font-bold mb-2">Expiration Date:</label>
              <input
                type="date"
                id="edit-product-exp-date"
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editProductExpDate}
                onChange={(e) => setEditProductExpDate(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-red-700 mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;