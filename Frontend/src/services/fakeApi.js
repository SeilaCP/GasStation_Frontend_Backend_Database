export const products = [
  {
    id: 1,
    name: "Fresh Bananas",
    price: 2.99,
    category: "Fruits",
    image: "../public/placeholder.jpg?height=200&width=200",
    stock: 50,
    barcode: "705632441947",
  },
  {
    id: 2,
    name: "Organic Apples",
    price: 4.99,
    category: "Fruits",
    image: "../public/placeholder.jpg?height=200&width=200",
    stock: 30,
    barcode: "705632441946",
  },
  {
    id: 3,
    name: "Whole Milk",
    price: 3.49,
    category: "Dairy",
    image: "../public/placeholder.jpg?height=200&width=200",
    stock: 25,
    barcode: "9780194770200",
  },
  {
    id: 4,
    name: "Greek Yogurt",
    price: 5.99,
    category: "Dairy",
    image: "../public/placeholder.jpg?height=200&width=200",
    stock: 20,
    barcode: "9789996327934",
  },
];

export const categories = ["All", "Fruits", "Vegetables", "Dairy", "Meat", "Bakery", "Pantry"];

export const createProduct = (product) => {
  const newProduct = {
    ...product,
    id: products.length + 1,
    image: "../public/placeholder.jpg?height=200&width=200", // Default image
  };
  products.push(newProduct);
  return newProduct;
}

export const removeProduct = (cart) => {
  const index = cart.map((c) => {
    return products.findIndex((p) => c.id === p.id);
  });

  console.log(index)
}