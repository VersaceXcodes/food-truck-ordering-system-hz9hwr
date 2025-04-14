import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { RootState, remove_cart_item, add_cart_item, set_cart_total } from "@/store/main";

const UV_CartReview: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((state: RootState) => state.cart_state);

  // Local state for tracking which item is being edited and its form values
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editCustomizations, setEditCustomizations] = useState<string>("");

  // Use a dummy price for demonstration since detailed price info is not provided.
  const dummyPrice = 10;

  // Compute total from current cart items based on dummy price
  const computedTotal = cart.items.reduce((sum, item) => sum + item.quantity * dummyPrice, 0);

  // Update cart total in global state whenever items change
  useEffect(() => {
    dispatch(set_cart_total(computedTotal));
  }, [cart.items, computedTotal, dispatch]);

  // Handler to trigger editing mode for a specific cart item
  const handleEditClick = (item: { menu_item_id: string; quantity: number; customizations: string }) => {
    setEditingItemId(item.menu_item_id);
    setEditQuantity(item.quantity);
    setEditCustomizations(item.customizations);
  };

  // Save changes by removing the old item and adding the updated item.
  const handleSaveEdit = () => {
    if (editingItemId) {
      dispatch(remove_cart_item(editingItemId));
      if (editQuantity > 0) {
        dispatch(
          add_cart_item({
            menu_item_id: editingItemId,
            quantity: editQuantity,
            customizations: editCustomizations,
          })
        );
      }
      setEditingItemId(null);
    }
  };

  // Cancel the editing process without saving changes.
  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  // Remove an item from the cart
  const handleRemoveItem = (menu_item_id: string) => {
    dispatch(remove_cart_item(menu_item_id));
  };

  // Handle proceeding to checkout – validates that cart is not empty
  const handleProceedToCheckout = () => {
    if (cart.items.length === 0) {
      alert("Your cart is empty. Please add items before proceeding to checkout.");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <>
      {cart.items.length === 0 ? (
        <div className="container mx-auto p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Link to="/home" className="text-blue-500 hover:underline">
            Return to Home
          </Link>
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <h2 className="text-2xl font-bold mb-4">Review Your Cart</h2>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Item ID</th>
                <th className="py-2 px-4 border-b">Quantity</th>
                <th className="py-2 px-4 border-b">Customizations</th>
                <th className="py-2 px-4 border-b">Price per Unit</th>
                <th className="py-2 px-4 border-b">Subtotal</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.menu_item_id}>
                  <td className="py-2 px-4 border-b">{item.menu_item_id}</td>
                  <td className="py-2 px-4 border-b">
                    {editingItemId === item.menu_item_id ? (
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(Number(e.target.value))}
                        className="border rounded p-1 w-16"
                      />
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {editingItemId === item.menu_item_id ? (
                      <input
                        type="text"
                        value={editCustomizations}
                        onChange={(e) => setEditCustomizations(e.target.value)}
                        className="border rounded p-1"
                      />
                    ) : (
                      item.customizations
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">${dummyPrice.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b">${(item.quantity * dummyPrice).toFixed(2)}</td>
                  <td className="py-2 px-4 border-b">
                    {editingItemId === item.menu_item_id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-500 text-white px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClick(item)}
                          className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.menu_item_id)}
                          className="bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-right">
            <p className="text-xl font-semibold">Total: ${computedTotal.toFixed(2)}</p>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleProceedToCheckout}
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
            >
              Review & Checkout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_CartReview;