// "use client"
import { useState, useMemo } from "react"
import { Search, ShoppingCart, Plus, Minus, History } from "lucide-react"
import { products, categories } from "../services/fakeApi"
import { Link } from 'react-router-dom';

export default function ProductPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      return prevCart.reduce((acc, item) => {
        if (item.id === productId) {
          if (item.quantity > 1) {
            acc.push({ ...item, quantity: item.quantity - 1 })
          }
        } else {
          acc.push(item)
        }
        return acc
      }, [])
    })
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">Store Inventory Tracker</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>

            {/* Cart button */}
            <button variant="outline" onClick={() => setShowCart(!showCart)} className="relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {getTotalItems() > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white">{getTotalItems()}</div>
              )}
            </button>
            <Link to="/add" className="ml-4">
              <button variant="outline" className="relative">
              <Plus className="h-4 w-4 mr-2" />
              add
            </button>
            </Link>
            <button variant="outline" className="relative" onClick={() => alert("Add product functionality not implemented yet")}>
              <History className="h-4 w-4 mr-2" />
              history
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Category Filter */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className="text-sm text-black px-3 py-3 rounded text-center hover:bg-black hover:text-white transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.image || "../public/placeholder.jpg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-green-600">${product.price}</span>
                      <button onClick={() => addToCart(product)} size="sm" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center">
                        <Minus className="h-4 w-4 mr-1" />
                        Clear
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{product.stock} in stock</p>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your search.</p>
              </div>
            )}
          </div>

          {/* Shopping Cart Sidebar */}
          {showCart && (
            <div className="w-80">
              <div className="sticky top-4">
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-4">Shopping Cart</h3>

                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Your cart is empty</p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-600">${item.price} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCart(item.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <button
                                size="sm"
                                variant="outline"
                                onClick={() => addToCart(item)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-semibold">Total: ${getTotalPrice()}</span>
                        </div>
                        <button className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-3 rounded text-center">Clear on stock</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
