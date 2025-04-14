import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { add_cart_item } from "@/store/main";

// Define types for our food truck details state
interface Review {
  reviewer: string;
  comment: string;
  rating: number;
}

interface MenuItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  is_sold_out: boolean;
}

interface FoodTruckDetails {
  id: string;
  truck_name: string;
  description: string;
  images: string[];
  operating_hours: string;
  ratings: number;
  reviews: Review[];
  menu_items: MenuItem[];
}

const UV_FoodTruckDetail: React.FC = () => {
  // Extract the food truck unique identifier from the URL
  const { id } = useParams<{ id: string }>();
  
  // Local state for food truck details, loading and error messages
  const [foodTruckDetails, setFoodTruckDetails] = useState<FoodTruckDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const dispatch = useDispatch();

  // Function to call backend to fetch detailed food truck info
  const fetchFoodTruckDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:1337/api/foodtrucks/${id}`);
      // Backend returns data in { food_truck: { ... } }
      const data: FoodTruckDetails = response.data.food_truck;
      setFoodTruckDetails(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Error fetching food truck details");
      setLoading(false);
    }
  };

  // Fetch food truck details on component mount and every 10 seconds for real-time updates
  useEffect(() => {
    fetchFoodTruckDetails();
    const interval = setInterval(() => {
      fetchFoodTruckDetails();
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  // Handler for the "Add to Cart" button on a menu item
  const handleAddToCart = (menuItem: MenuItem) => {
    if (menuItem.is_sold_out) {
      alert("This item is sold out.");
      return;
    }
    const quantityStr = prompt(`Enter quantity for "${menuItem.title}"`, "1");
    if (!quantityStr) return;
    const quantity = parseInt(quantityStr);
    if (isNaN(quantity) || quantity <= 0) {
      alert("Invalid quantity");
      return;
    }
    const customizations = prompt("Enter customization notes (optional)", "") || "";
    dispatch(add_cart_item({
      menu_item_id: menuItem.id,
      quantity: quantity,
      customizations: customizations
    }));
    alert(`"${menuItem.title}" added to cart`);
  };

  return (
    <>
      <div className="container mx-auto p-4">
        {loading ? (
          <div className="text-center text-xl">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 text-xl">Error: {error}</div>
        ) : foodTruckDetails ? (
          <div>
            <Link to="/home" className="text-blue-500 hover:underline">&larr; Back to Home</Link>
            <div className="mt-4">
              <h1 className="text-3xl font-bold">{foodTruckDetails.truck_name}</h1>
              <div className="mt-2">
                {foodTruckDetails.images && foodTruckDetails.images.length > 0 ? (
                  <img src={foodTruckDetails.images[0]} alt={foodTruckDetails.truck_name} className="w-full h-auto rounded" />
                ) : (
                  <img src={`https://picsum.photos/seed/${foodTruckDetails.id}/800/400`} alt="Default" className="w-full h-auto rounded" />
                )}
              </div>
              <div className="mt-4">
                <p className="text-gray-700">{foodTruckDetails.description}</p>
                <p className="mt-2">
                  <span className="font-semibold">Operating Hours:</span> {foodTruckDetails.operating_hours}
                </p>
                <p className="mt-2">
                  <span className="font-semibold">Ratings:</span> {foodTruckDetails.ratings.toFixed(1)} / 5
                </p>
              </div>
            </div>

            {/* Reviews Section */}
            {foodTruckDetails.reviews && foodTruckDetails.reviews.length > 0 && (
              <div className="mt-6">
                <h2 className="text-2xl font-semibold">Customer Reviews</h2>
                <ul className="mt-2 space-y-4">
                  {foodTruckDetails.reviews.map((review, index) => (
                    <li key={index} className="border p-2 rounded shadow">
                      <p className="font-semibold">{review.reviewer}</p>
                      <p className="text-sm text-gray-600">Rating: {review.rating} / 5</p>
                      <p>{review.comment}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Menu Section */}
            {foodTruckDetails.menu_items && foodTruckDetails.menu_items.length > 0 && (
              <div className="mt-6">
                <h2 className="text-2xl font-semibold">Menu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {foodTruckDetails.menu_items.map((item) => (
                    <div key={item.id} className="border rounded p-4 shadow flex flex-col">
                      <img src={item.image_url || `https://picsum.photos/seed/${item.id}/400/300`} alt={item.title} className="w-full h-48 object-cover rounded" />
                      <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
                      <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
                      <p className="mt-1 font-semibold">${item.price.toFixed(2)}</p>
                      {item.is_sold_out ? (
                        <span className="mt-2 text-red-500 font-bold">Sold Out</span>
                      ) : (
                        <button onClick={() => handleAddToCart(item)} className="mt-2 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                          Add to Cart
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
};

export default UV_FoodTruckDetail;