import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { RootState, clear_cart } from "@/store/main";

const UV_PaymentReview: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Access global state for cart and auth
  const cart_state = useSelector((state: RootState) => state.cart_state);
  const auth_state = useSelector((state: RootState) => state.auth_state);

  // Local state for order summary
  const [orderSummary, setOrderSummary] = useState<{
    items: Array<{ menu_item_id: string; quantity: number; price: number; customizations: string }>;
    tax: number;
    total: number;
    paymentMethod: string;
    paymentDetails: any;
  }>({
    items: [],
    tax: 0,
    total: 0,
    paymentMethod: "",
    paymentDetails: {},
  });

  // Local state for online payment details
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Local state for error messages and loading state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Compute order summary from the cart_state when it changes
  useEffect(() => {
    const cartTotal = cart_state.total;
    const tax = parseFloat((cartTotal * 0.1).toFixed(2));
    const grandTotal = cartTotal + tax;
    // For each cart item, we add a computed price.
    // As cart_state items do not include price, distribute cart total by quantity sum.
    const totalQuantity = cart_state.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemsWithPrice = cart_state.items.map((item) => ({
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: totalQuantity > 0 ? parseFloat((cartTotal / totalQuantity).toFixed(2)) : 0,
      customizations: item.customizations,
    }));
    setOrderSummary({
      items: itemsWithPrice,
      tax: tax,
      total: grandTotal,
      paymentMethod: "",
      paymentDetails: {},
    });
  }, [cart_state]);

  // Handle payment method change via radio buttons
  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderSummary((prev) => ({ ...prev, paymentMethod: e.target.value }));
  };

  // Handle form submission for placing the order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (cart_state.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!orderSummary.paymentMethod) {
      setError("Please select a payment method.");
      return;
    }
    if (orderSummary.paymentMethod === "online") {
      // Simple validations for credit card details
      if (!cardNumber || cardNumber.trim().length < 12) {
        setError("Please enter a valid credit card number.");
        return;
      }
      if (!expiry) {
        setError("Please enter the expiry date.");
        return;
      }
      if (!cvv || cvv.trim().length < 3) {
        setError("Please enter a valid CVV.");
        return;
      }
    }

    // Build paymentDetails object if online payment option is chosen
    let paymentDetails = {};
    if (orderSummary.paymentMethod === "online") {
      paymentDetails = {
        card_number: cardNumber,
        expiry: expiry,
        cvv: cvv,
      };
    }

    // Update order summary object with payment details
    const finalOrderSummary = {
      ...orderSummary,
      paymentDetails: paymentDetails,
    };

    // For demonstration, assume all cart items are from a single food truck.
    // Since cart_state does not supply food_truck_id, we use a default/trivial value.
    const food_truck_id = "default_truck";

    // Build the order request payload according to the backend spec
    const payload = {
      food_truck_id: food_truck_id,
      payment_method: finalOrderSummary.paymentMethod,
      total_amount: finalOrderSummary.total,
      cart_items: cart_state.items.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        customizations: item.customizations,
      })),
    };

    try {
      setLoading(true);
      const response = await fetch("http://localhost:1337/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth_state.token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to place order.");
        setLoading(false);
        return;
      }
      // On successful order placement, clear the cart and navigate to order confirmation view
      dispatch(clear_cart());
      navigate("/order-confirmation");
    } catch (err: any) {
      setError("Error placing order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Payment &amp; Order Review</h1>
        {error && <div className="bg-red-200 text-red-800 p-2 mb-4">{error}</div>}
        <div className="border p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
          {cart_state.items.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="border-b p-2">Item ID</th>
                  <th className="border-b p-2">Quantity</th>
                  <th className="border-b p-2">Customizations</th>
                </tr>
              </thead>
              <tbody>
                {orderSummary.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border-b p-2">{item.menu_item_id}</td>
                    <td className="border-b p-2">{item.quantity}</td>
                    <td className="border-b p-2">{item.customizations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-4">
            <p>Subtotal: ${cart_state.total.toFixed(2)}</p>
            <p>Tax (10%): ${orderSummary.tax.toFixed(2)}</p>
            <p className="font-bold">Total: ${orderSummary.total.toFixed(2)}</p>
          </div>
        </div>
        <form onSubmit={handlePlaceOrder}>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Select Payment Method</h2>
            <div>
              <label className="mr-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={orderSummary.paymentMethod === "online"}
                  onChange={handlePaymentMethodChange}
                  className="mr-1"
                />
                Online Payment
              </label>
              <label>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={orderSummary.paymentMethod === "cash"}
                  onChange={handlePaymentMethodChange}
                  className="mr-1"
                />
                Cash on Delivery
              </label>
            </div>
          </div>
          {orderSummary.paymentMethod === "online" && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Credit Card Details</h3>
              <div className="mb-2">
                <label className="block mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full p-2 border"
                  placeholder="Enter card number"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Expiry Date</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full p-2 border"
                  placeholder="MM/YY"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">CVV</label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full p-2 border"
                  placeholder="Enter CVV"
                />
              </div>
            </div>
          )}
          <div className="flex items-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
            <Link to="/cart" className="ml-4 text-blue-600 hover:underline">
              Back to Cart
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default UV_PaymentReview;