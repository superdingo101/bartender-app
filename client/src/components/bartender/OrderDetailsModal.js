import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

import API_URL from '../../config/api';

const OrderDetailsModal = ({ order, onClose, allOrders, onComplete }) => {
  const { token } = useAuth();
  const [drinkDetails, setDrinkDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [unclaiming, setUnclaiming] = useState(false);

  useEffect(() => {
    loadDrinkDetails();
  }, [order.drinkId]);

  const loadDrinkDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/drinks/${order.drinkId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDrinkDetails(response.data.drink);
    } catch (err) {
      console.error('Failed to load drink details:', err);
      setError('Failed to load drink details');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    setCompleting(true);
    try {
      await axios.put(
        `${API_URL}/api/orders/${order.id}/status`,
        { status: 'COMPLETED' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Call the completion callback if provided
      if (onComplete) {
        onComplete();
      }

      // Close the modal
      onClose();
    } catch (err) {
      console.error('Failed to complete order:', err);
      alert('Failed to complete order: ' + (err.response?.data?.error || err.message));
    } finally {
      setCompleting(false);
    }
  };


  const handleUnclaimOrder = async () => {
    setUnclaiming(true);
    try {
      await axios.put(
        `${API_URL}/api/orders/${order.id}/status`,
        { status: 'PENDING' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onComplete) {
        onComplete();
      }

      onClose();
    } catch (err) {
      console.error('Failed to unclaim order:', err);
      alert('Failed to unclaim order: ' + (err.response?.data?.error || err.message));
    } finally {
      setUnclaiming(false);
    }
  };

  // Calculate total quantity of this drink in queue (IN_PROGRESS status)
  const calculateTotalQuantity = () => {
    if (!allOrders) return order.quantity;

    return allOrders
      .filter(o => o.drinkId === order.drinkId && o.status === 'IN_PROGRESS' && o.claimedById === order.claimedById)
      .reduce((sum, o) => sum + o.quantity, 0);
  };

  const totalQuantity = calculateTotalQuantity();

  // Scale ingredients based on total quantity
  const getScaledIngredients = () => {
    if (!drinkDetails?.ingredients) return [];

    return drinkDetails.ingredients.map(di => ({
      ...di,
      scaledQuantity: (di.quantity * totalQuantity).toFixed(2)
    }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center text-gray-600">Loading details...</div>
        </div>
      </div>
    );
  }

  if (error || !drinkDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="text-center text-red-600 mb-4">{error || 'Drink details not found'}</div>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const scaledIngredients = getScaledIngredients();
  const hasIngredients = scaledIngredients.length > 0;
  const hasEquipment = drinkDetails.equipment && drinkDetails.equipment.length > 0;
  const hasGlass = drinkDetails.glassType;
  const hasInstructions = drinkDetails.instructions && drinkDetails.instructions.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-3xl font-bold mb-1">{drinkDetails.name}</h2>
              <p className="text-purple-100">Order ID: {order.id.substring(0, 8)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded">
              This Order: <strong>{order.quantity}x</strong>
            </div>
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded">
              Total in Queue: <strong>{totalQuantity}x</strong>
            </div>
            {order.customerName && (
              <div className="bg-white bg-opacity-20 px-3 py-1 rounded">
                Customer: <strong>{order.customerName}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Glass Type Section */}
          {hasGlass && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center">
                🥃 Glass Type
              </h3>
              <div className="text-blue-800">
                <p className="font-semibold text-xl">{drinkDetails.glassType.name}</p>
                {drinkDetails.glassType.capacity && (
                  <p className="text-sm mt-1">Capacity: {drinkDetails.glassType.capacity} oz</p>
                )}
                {drinkDetails.glassType.description && (
                  <p className="text-sm mt-1 text-blue-700">{drinkDetails.glassType.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Ingredients Section */}
          {hasIngredients && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                🧪 Ingredients <span className="ml-2 text-sm font-normal text-gray-600">(scaled for {totalQuantity} drink{totalQuantity > 1 ? 's' : ''})</span>
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Ingredient</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Brand</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Per Drink</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Total Needed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {scaledIngredients.map((di, index) => (
                      <tr key={index} className="hover:bg-gray-100">
                        <td className="px-4 py-3 text-gray-800 font-medium">{di.ingredient.name}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {di.ingredient.brand || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {di.quantity} {di.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-purple-700">
                          {di.scaledQuantity} {di.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Equipment Section */}
          {hasEquipment && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                🔧 Equipment Needed
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {drinkDetails.equipment.map((de) => (
                  <div
                    key={de.id}
                    className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center"
                  >
                    <p className="font-semibold text-orange-900">{de.equipment.name}</p>
                    {de.equipment.description && (
                      <p className="text-xs text-orange-700 mt-1">{de.equipment.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions Section */}
          {hasInstructions && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                📋 Instructions
              </h3>
              <div className="space-y-3">
                {drinkDetails.instructions.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      {inst.stepNumber}
                    </div>
                    <p className="flex-1 text-gray-800 pt-1">{inst.instruction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Additional Info Message */}
          {!hasIngredients && !hasEquipment && !hasGlass && !hasInstructions && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🍹</div>
              <p className="text-lg">No additional preparation details available for this drink.</p>
              <p className="text-sm mt-2">Ingredients, equipment, glass type, and instructions have not been configured.</p>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-bold text-yellow-900 mb-2">📝 Customer Notes:</h3>
              <p className="text-yellow-800">{order.notes}</p>
            </div>
          )}
        </div>

         {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={completing || unclaiming}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-lg transition disabled:opacity-50"
            >
              Close Recipe
            </button>
            {order.status === 'IN_PROGRESS' && (
              <button
                onClick={handleUnclaimOrder}
                disabled={completing || unclaiming}
                className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium text-lg transition disabled:opacity-50"
              >
                {unclaiming ? '⏳ Unclaiming...' : '↩️ Unclaim this order'}
              </button>
            )}
            {order.status === 'IN_PROGRESS' && (
              <button
                onClick={handleCompleteOrder}
                disabled={completing || unclaiming}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-lg transition disabled:opacity-50"
              >
                {completing ? '⏳ Completing...' : '✅ Close and Mark Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
