import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import Navigation from './Navigation';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const StatCard = ({ label, value, icon }) => (
  <div className="bg-white rounded-lg shadow p-5">
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-sm font-medium text-gray-500">{label}</div>
    <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
  </div>
);

const EmptyState = () => (
  <tr>
    <td className="px-4 py-6 text-center text-gray-500" colSpan="4">
      No data available for this report.
    </td>
  </tr>
);

const ReportTable = ({ title, columns, rows, renderRow }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.length === 0 ? <EmptyState /> : rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  </div>
);

const ReportsPage = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvents(response.data.events || []);
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };

    if (token) {
      loadEvents();
    }
  }, [token]);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError('');
      try {
        const eventQuery = selectedEventId === 'ALL' ? '' : `?eventId=${selectedEventId}`;
        const response = await axios.get(`${API_URL}/api/reports${eventQuery}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReport(response.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadReport();
    }
  }, [token, selectedEventId]);

  const selectedLabel = useMemo(() => {
    if (selectedEventId === 'ALL') return 'All-time reporting';
    return events.find((event) => event.id === selectedEventId)?.name || 'Selected event';
  }, [events, selectedEventId]);

  const formatNumber = (value) => numberFormatter.format(value || 0);
  const formatCurrency = (value) => currencyFormatter.format(value || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Reporting Dashboard</h2>
            <p className="text-gray-500 mt-1">
              Review drink production, ingredient usage, customer volume, and bartender output.
            </p>
          </div>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Report scope
            <select
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="ALL">All-time stats</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading || !report ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
            Loading report...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-purple-700 text-white rounded-lg shadow p-6">
              <div className="text-sm uppercase tracking-wide opacity-80">Current scope</div>
              <div className="text-2xl font-bold mt-1">{selectedLabel}</div>
              {report.event && (
                <div className="text-purple-100 mt-2">
                  {new Date(report.event.date).toLocaleDateString()} • {report.event.location}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Non-cancelled orders" value={formatNumber(report.totals.orders)} icon="🧾" />
              <StatCard label="Completed orders" value={formatNumber(report.totals.completedOrders)} icon="✅" />
              <StatCard label="Drinks made" value={formatNumber(report.totals.drinksMade)} icon="🍹" />
              <StatCard label="Ingredient cost used" value={formatCurrency(report.totals.totalIngredientCost)} icon="💵" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ReportTable
                title="Drinks Made"
                columns={['Drink', 'Drinks Made', 'Completed Orders']}
                rows={report.drinksMade}
                renderRow={(row) => (
                  <tr key={row.drinkId}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.drinkName}</td>
                    <td className="px-4 py-3 text-gray-700">{formatNumber(row.quantity)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatNumber(row.orderCount)}</td>
                  </tr>
                )}
              />

              <ReportTable
                title="Ingredient Usage and Cost"
                columns={['Ingredient', 'Used', 'Estimated Cost']}
                rows={report.ingredientUsage}
                renderRow={(row) => (
                  <tr key={`${row.ingredientId}-${row.unit}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.ingredientName}</td>
                    <td className="px-4 py-3 text-gray-700">{formatNumber(row.quantity)} {row.unit}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.hasCost ? formatCurrency(row.estimatedCost) : 'Cost unavailable'}
                    </td>
                  </tr>
                )}
              />

              <ReportTable
                title="Orders per Customer"
                columns={['Customer', 'Email', 'Orders']}
                rows={report.customerOrders}
                renderRow={(row) => (
                  <tr key={row.customerId || row.customerName}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.customerName}</td>
                    <td className="px-4 py-3 text-gray-700">{row.email || 'Guest checkout'}</td>
                    <td className="px-4 py-3 text-gray-700">{formatNumber(row.orderCount)}</td>
                  </tr>
                )}
              />

              <ReportTable
                title="Drinks Ordered per Person"
                columns={['Person', 'Email', 'Drinks Ordered']}
                rows={report.personDrinks}
                renderRow={(row) => (
                  <tr key={row.customerId || row.customerName}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.customerName}</td>
                    <td className="px-4 py-3 text-gray-700">{row.email || 'Guest checkout'}</td>
                    <td className="px-4 py-3 text-gray-700">{formatNumber(row.drinkCount)}</td>
                  </tr>
                )}
              />

              <div className="xl:col-span-2">
                <ReportTable
                  title="Drinks Made by Bartender"
                  columns={['Bartender', 'Drinks Made', 'Completed Orders']}
                  rows={report.bartenderDrinks}
                  renderRow={(row) => (
                    <tr key={row.bartenderId}>
                      <td className="px-4 py-3 font-medium text-gray-900">{row.bartenderName}</td>
                      <td className="px-4 py-3 text-gray-700">{formatNumber(row.drinkCount)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatNumber(row.orderCount)}</td>
                    </tr>
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
