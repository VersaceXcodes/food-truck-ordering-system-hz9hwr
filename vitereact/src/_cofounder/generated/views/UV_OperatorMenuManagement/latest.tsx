import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";
import { Link } from "react-router-dom";

interface MenuItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  modifiers: string;
  is_sold_out: boolean;
}

interface EditingItem {
  id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  modifiers: string;
  is_sold_out: boolean;
}

const UV_OperatorMenuManagement: React.FC = () => {
  const authState = useSelector((state: RootState) => state.auth_state);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<EditingItem>({
    title: "",
    description: "",
    price: 0,
    category: "",
    image_url: "",
    modifiers: "",
    is_sold_out: false,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Fetch menu items on component mount if user is operator.
  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`http://localhost:1337/api/menu-items`, {
        params: { food_truck_id: authState.user_id },
      });
      if (response.data && response.data.menu_items) {
        setMenuItems(response.data.menu_items);
      }
    } catch (error: any) {
      console.error("Error fetching menu items", error);
      alert("Error fetching menu items: " + error.message);
    }
  };

  useEffect(() => {
    if (authState.isAuthenticated && authState.role === "operator") {
      fetchMenuItems();
    }
  }, [authState]);

  // Handle input changes for the editing form.
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setEditingItem((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "price"
          ? parseFloat(value)
          : value,
    }));
  };

  // Save handler for creating or updating a menu item.
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    let errors: { [key: string]: string } = {};
    if (!editingItem.title.trim()) errors.title = "Title is required";
    if (!editingItem.category.trim()) errors.category = "Category is required";
    if (!editingItem.price || editingItem.price <= 0)
      errors.price = "Price must be greater than 0";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    // Prepare payload. The backend expects is_sold_out as a string "true" or "false".
    const payload = {
      food_truck_id: authState.user_id,
      title: editingItem.title,
      description: editingItem.description,
      price: editingItem.price,
      category: editingItem.category,
      image_url: editingItem.image_url,
      modifiers: editingItem.modifiers,
      is_sold_out: editingItem.is_sold_out ? "true" : "false",
    };
    try {
      if (editingItem.id) {
        // Update existing menu item.
        const response = await axios.put(
          `http://localhost:1337/api/menu-items/${editingItem.id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${authState.token}` },
          }
        );
        if (response.data.success) {
          setMenuItems((prev) =>
            prev.map((item) =>
              item.id === editingItem.id ? response.data.menu_item : item
            )
          );
          alert("Menu item updated successfully");
        }
      } else {
        // Create new menu item.
        const response = await axios.post(
          `http://localhost:1337/api/menu-items`,
          payload,
          {
            headers: { Authorization: `Bearer ${authState.token}` },
          }
        );
        if (response.data.success) {
          setMenuItems((prev) => [...prev, response.data.menu_item]);
          alert("Menu item created successfully");
        }
      }
      // Clear the editing form.
      setEditingItem({
        title: "",
        description: "",
        price: 0,
        category: "",
        image_url: "",
        modifiers: "",
        is_sold_out: false,
      });
      setFormErrors({});
    } catch (error: any) {
      console.error("Error saving menu item", error);
      alert("Error saving menu item: " + error.message);
    }
  };

  // Handle editing an existing item by populating the form.
  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
  };

  // Handle deletion of a menu item with confirmation.
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        const response = await axios.delete(`http://localhost:1337/api/menu-items/${id}`, {
          headers: { Authorization: `Bearer ${authState.token}` },
        });
        if (response.data.success) {
          setMenuItems((prev) => prev.filter((item) => item.id !== id));
          alert("Menu item deleted successfully");
        }
      } catch (error: any) {
        console.error("Error deleting menu item", error);
        alert("Error deleting menu item: " + error.message);
      }
    }
  };

  // Handle toggle of sold out status. Calls update API to persist the change.
  const handleToggleSoldOut = async (item: MenuItem) => {
    const updatedValue = !item.is_sold_out;
    const payload = {
      food_truck_id: authState.user_id,
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      image_url: item.image_url,
      modifiers: item.modifiers,
      is_sold_out: updatedValue ? "true" : "false",
    };
    try {
      const response = await axios.put(
        `http://localhost:1337/api/menu-items/${item.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${authState.token}` },
        }
      );
      if (response.data.success) {
        setMenuItems((prev) =>
          prev.map((it) => (it.id === item.id ? response.data.menu_item : it))
        );
        alert("Sold out status updated successfully");
      }
    } catch (error: any) {
      console.error("Error toggling sold out status", error);
      alert("Error toggling sold out status: " + error.message);
    }
  };

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Operator Menu Management</h1>
        {authState.role !== "operator" ? (
          <div>
            <p>You are not authorized to view this page. Please <Link to="/login" className="text-blue-500 underline">login</Link> as an operator.</p>
          </div>
        ) : (
          <>
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Your Menu Items</h2>
              {menuItems.length === 0 ? (
                <p>No menu items found. Please add a menu item below.</p>
              ) : (
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border">Title</th>
                      <th className="py-2 px-4 border">Price</th>
                      <th className="py-2 px-4 border">Category</th>
                      <th className="py-2 px-4 border">Sold Out</th>
                      <th className="py-2 px-4 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-4 border">{item.title}</td>
                        <td className="py-2 px-4 border">${item.price.toFixed(2)}</td>
                        <td className="py-2 px-4 border">{item.category}</td>
                        <td className="py-2 px-4 border text-center">
                          <input
                            type="checkbox"
                            checked={item.is_sold_out}
                            onChange={() => handleToggleSoldOut(item)}
                          />
                        </td>
                        <td className="py-2 px-4 border">
                          <button
                            className="bg-blue-500 text-white px-2 py-1 mr-2 rounded"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="bg-red-500 text-white px-2 py-1 rounded"
                            onClick={() => handleDelete(item.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-2">
                {editingItem.id ? "Edit Menu Item" : "Add New Menu Item"}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={editingItem.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border px-2 py-1"
                  />
                  {formErrors.title && (
                    <p className="text-red-500 text-sm">{formErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">Description</label>
                  <textarea
                    name="description"
                    value={editingItem.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border px-2 py-1"
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-sm">{formErrors.description}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={editingItem.price}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border px-2 py-1"
                    step="0.01"
                  />
                  {formErrors.price && (
                    <p className="text-red-500 text-sm">{formErrors.price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={editingItem.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border px-2 py-1"
                  />
                  {formErrors.category && (
                    <p className="text-red-500 text-sm">{formErrors.category}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">Image URL</label>
                  <input
                    type="text"
                    name="image_url"
                    value={editingItem.image_url}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Modifiers / Special Notes</label>
                  <textarea
                    name="modifiers"
                    value={editingItem.modifiers}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border px-2 py-1"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_sold_out"
                    checked={editingItem.is_sold_out}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-sm">Mark as Sold Out</label>
                </div>
                <div className="flex space-x-4">
                  <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                    Save
                  </button>
                  {editingItem.id && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingItem({
                          title: "",
                          description: "",
                          price: 0,
                          category: "",
                          image_url: "",
                          modifiers: "",
                          is_sold_out: false,
                        })
                      }
                      className="bg-gray-500 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>
          </>
        )}
      </div>
    </>
  );
};

export default UV_OperatorMenuManagement;