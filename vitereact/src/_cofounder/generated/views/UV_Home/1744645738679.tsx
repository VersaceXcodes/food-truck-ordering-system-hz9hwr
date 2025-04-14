import React, { useEffect, useState, FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

interface FoodTruck {
  id: string;
  operator_id: string;
  truck_name: string;
  description: string;
  cuisine_type: string;
  image_url: string;
  location: string;
  active: string;
  created_at: number;
  updated_at: number;
}

interface Filters {
  search: string;
  cuisine_type: string;
  location: string;
}

const UV_Home: React.FC = () => {
  // Get URL search parameters
  const [searchParams] = useSearchParams();

  // Initialize filters from URL parameters or default values
  const initialFilters: Filters = {
    search: searchParams.get("search") || "",
    cuisine_type: searchParams.get("cuisine_type") || "",
    location: searchParams.get("location") || ""
  };

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [discoveryResults, setDiscoveryResults] = useState<FoodTruck[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<string>("list");

  // Function to fetch food trucks from backend, using current filters
  const fetchFoodTrucks = async () => {
    setIsLoading(true);
    try {
      // Build query parameters string
      const query = new URLSearchParams();
      if (filters.search) {
        query.append("search", filters.search);
      }
      if (filters.cuisine_type) {
        query.append("cuisine_type", filters.cuisine_type);
      }
      if (filters.location) {
        query.append("location", filters.location);
      }
      const response = await fetch(`http://localhost:1337/api/foodtrucks?${query.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch food trucks");
      }
      const data = await response.json();
      // Assuming data is in the format: { food_trucks: [...] }
      setDiscoveryResults(data.food_trucks || []);
    } catch (error) {
      console.error("Error fetching food trucks:", error);
      setDiscoveryResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch on component mount
  useEffect(() => {
    fetchFoodTrucks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called when the user submits the filter form
  const applyFilters = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchFoodTrucks();
  };

  // Toggle view mode between 'list' and 'map'
  const toggleViewMode = () => {
    setViewMode(viewMode === "list" ? "map" : "list");
  };

  return (
    <>
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-4">Discover Food Trucks</h1>
        {/* Filter Form */}
        <form onSubmit={applyFilters} className="mb-6 flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-col">
            <label htmlFor="search" className="font-semibold">Search</label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="border rounded px-2 py-1"
              placeholder="Enter search term"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="cuisine_type" className="font-semibold">Cuisine Type</label>
            <input
              type="text"
              id="cuisine_type"
              value={filters.cuisine_type}
              onChange={e => setFilters({ ...filters, cuisine_type: e.target.value })}
              className="border rounded px-2 py-1"
              placeholder="e.g. Mexican"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="location" className="font-semibold">Location</label>
            <input
              type="text"
              id="location"
              value={filters.location}
              onChange={e => setFilters({ ...filters, location: e.target.value })}
              className="border rounded px-2 py-1"
              placeholder="e.g. San Francisco"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600">
              Apply Filters
            </button>
            <button
              type="button"
              onClick={toggleViewMode}
              className="bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600"
            >
              {viewMode === "list" ? "Switch to Map View" : "Switch to List View"}
            </button>
          </div>
        </form>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center text-xl font-semibold">
            Loading food trucks...
          </div>
        )}

        {/* Display Results */}
        {!isLoading && (
          <>
            {/* If in map view, show map header */}
            {viewMode === "map" && (
              <div className="mb-4 p-4 bg-gray-100 text-center rounded">
                <p className="text-xl font-semibold">Map View is Selected</p>
                <p className="text-sm text-gray-600">Interactive map integration is not available yet, showing list view as fallback.</p>
              </div>
            )}
            {/* Food Truck Cards */}
            {discoveryResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {discoveryResults.map(truck => (
                  <Link key={truck.id} to={`/food-trucks/${truck.id}`} className="block border rounded overflow-hidden hover:shadow-lg transition-shadow">
                    <img
                      src={truck.image_url || `https://picsum.photos/seed/${truck.id}/400/300`}
                      alt={truck.truck_name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h2 className="text-xl font-bold mb-1">{truck.truck_name}</h2>
                      <p className="text-sm text-gray-700 mb-1">Cuisine: {truck.cuisine_type}</p>
                      <p className="text-sm text-gray-600">Location: {truck.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-lg text-gray-700 mt-8">
                No food trucks found matching your criteria.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default UV_Home;