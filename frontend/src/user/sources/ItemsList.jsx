import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ItemsList.css';
import config from '../../config';

const ItemsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${config.backendUrl}/items`);
      const sortedItems = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(sortedItems);
      setLoading(false); // Set loading to false after data is fetched
    } catch (error) {
      console.error('Error fetching items:', error);
      setLoading(false); // Set loading to false even if there's an error
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCardClick = (hyperlink) => {
    window.open(hyperlink, '_blank');
  };

  return (
    <div className="page-container">
      <div className="outer-border">
        <div className="w-full max-w-6xl p-4 mx-auto">
          <h2 className="mb-6 text-2xl font-bold">Resources</h2>
          {loading ? (
            <div className="loading-spinner loading-delay"></div> // Apply loading delay animation
          ) : (
            <div className="space-y-4 fade-in"> {/* Apply fade-in animation */}
              {items.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleCardClick(item.hyperlink)}
                  className="p-4 transition-transform duration-200 rounded-lg shadow-sm cursor-pointer bg-blue-50 hover:flyout"
                >
                  <div className="item-container">
                    <div className="bullet-point"></div>
                    <h3 className="item-title">{item.title}</h3>
                  </div>
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemsList;