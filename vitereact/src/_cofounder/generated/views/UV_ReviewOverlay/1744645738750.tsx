import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, set_modal } from "@/store/main";

const UV_ReviewOverlay: React.FC = () => {
  const dispatch = useDispatch();
  const currentOrder = useSelector((state: RootState) => state.orders_state.currentOrder);
  const token = useSelector((state: RootState) => state.auth_state.token);

  // Local state for rating, review text and orderId along with submission flag and error message.
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  // On mount, if current order exists and orderId is not yet set, initialize orderId.
  useEffect(() => {
    if (currentOrder && !orderId) {
      setOrderId(currentOrder.id);
    }
  }, [currentOrder, orderId]);

  // Handles clicking on a star; sets the rating state.
  const handleStarClick = (star: number) => {
    setRating(star);
  };

  // Function to dismiss the overlay modal.
  const handleDismiss = () => {
    dispatch(set_modal({ modal: "reviewOverlay", value: false }));
  };

  // Submit review function: validates input, calls POST /api/reviews and handles response.
  const handleSubmit = async () => {
    if (rating < 1) {
      setError("Please provide a rating between 1 and 5 stars.");
      return;
    }
    if (!orderId) {
      setError("Order information is missing.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    // Retrieve food_truck_id from the current order.
    const food_truck_id = currentOrder?.food_truck_id;
    if (!food_truck_id) {
      setError("Food truck information is missing.");
      setIsSubmitting(false);
      return;
    }

    const reviewPayload = {
      order_id: orderId,
      food_truck_id: food_truck_id,
      rating: rating,
      review_text: reviewText
    };

    try {
      const response = await fetch("http://localhost:1337/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(reviewPayload)
      });
      const data = await response.json();
      if (response.ok) {
        setSubmitted(true);
        // Auto-dismiss modal after 2 seconds on successful submission.
        setTimeout(() => {
          dispatch(set_modal({ modal: "reviewOverlay", value: false }));
        }, 2000);
      } else {
        setError(data.message || "Failed to submit review.");
      }
    } catch (e) {
      setError("Network error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
          {submitted ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
              <p className="mb-4">Your review has been submitted successfully.</p>
              <button
                onClick={handleDismiss}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4 text-center">Review Your Order</h2>
              <p className="mb-4 text-center">Please rate your order and leave a comment (optional):</p>
              <div className="flex justify-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(star)}
                    className="text-3xl focus:outline-none"
                  >
                    <span className={star <= rating ? "text-yellow-400" : "text-gray-300"}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Optional feedback..."
                className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={4}
              />
              {error && <p className="text-red-500 text-center mb-4">{error}</p>}
              <div className="flex justify-around">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_ReviewOverlay;