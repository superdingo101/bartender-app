import React from 'react';

const EventCard = ({ event, onEdit, onDelete, onShowQR, onManageMenu }) => {
  const statusColors = {
    UPCOMING: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800">{event.name}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
          {event.status}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <span className="mr-2">📅</span>
          {new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
        <div className="flex items-center">
          <span className="mr-2">📍</span>
          {event.location}
        </div>
        <div className="flex items-center">
          <span className="mr-2">🔑</span>
          <code className="bg-gray-100 px-2 py-1 rounded">{event.code}</code>
        </div>
        <div className="flex items-center">
          <span className="mr-2">🍹</span>
          {event._count?.drinks || 0} drinks
        </div>
        <div className="flex items-center">
          <span className="mr-2">🛒</span>
          {event._count?.orders || 0} orders
        </div>
      </div>

      {event.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onShowQR}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium flex items-center justify-center space-x-1 transition"
        >
          <span>📱</span>
          <span>QR Code</span>
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition"
        >
          ✏️ Edit
        </button>
        <button
          onClick={onManageMenu}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium col-span-2 transition"
        >
          Manage Menu
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm col-span-2 transition"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
};

export default EventCard;