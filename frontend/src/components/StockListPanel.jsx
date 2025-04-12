import { useEffect, useState } from 'react';
import axios from 'axios';

const StockListPanel = ({ userId, ownedLists, sharedLists }) => {
  const [listName, setListName] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [items, setItems] = useState('');

  const createStockList = async () => {
    try {
      const parsedItems = items.split(',').map(s => {
        const [symbol, num] = s.trim().split(':');
        return { symbol, num_shares: parseInt(num) };
      });

      await axios.post('http://localhost:3000/api/stocklists', {
        list_name: listName,
        visibility,
        items: parsedItems
      }, {
        headers: { 'x-user-id': userId }
      });

      setListName('');
      setItems('');
      window.location.reload();
    } catch (err) {
      alert('Error creating list');
    }
  };

  const deleteStockList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list?')) return;

    try {
      await axios.delete(`http://localhost:3000/api/stocklists/${listId}`, {
        headers: { 'x-user-id': userId }
      });
      window.location.reload();
    } catch (err) {
      alert('Failed to delete list');
    }
  };

  const combineLists = [...ownedLists, ...sharedLists];

  const groupedLists = {};
  combineLists.forEach(item => {
    if (!groupedLists[item.list_id]) {
      groupedLists[item.list_id] = {
        list_id: item.list_id,
        list_name: item.list_name,
        visibility: item.visibility,
        user_id: item.user_id,
        shared_by: item.shared_by,
        items: []
      };
    }

    if (item.symbol && item.num_shares) {
      groupedLists[item.list_id].items.push({
        symbol: item.symbol,
        num_shares: item.num_shares
      });
    }
  });

  const groupedArray = Object.values(groupedLists);

  return (
    <div className="p-4 border rounded-lg shadow mb-4">
      <h2 className="text-xl font-semibold mb-2">Your Stock Lists</h2>

      <div className="mb-4">
        <input
          placeholder="List Name"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          className="border p-1 mr-2"
        />
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="border p-1 mr-2"
        >
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
        <input
          placeholder="Items (e.g., AAPL:5, GOOG:3)"
          value={items}
          onChange={(e) => setItems(e.target.value)}
          className="border p-1 mr-2 w-[300px]"
        />
        <button onClick={createStockList} className="bg-blue-500 text-white px-3 py-1 rounded">
          Create
        </button>
      </div>

      {groupedArray.map((list) => (
        <div key={list.list_id} className="mb-2 p-2 border rounded">
          <div className="flex justify-between items-center">
            <div>
              <strong>{list.list_name}</strong> ({list.visibility})
              {list.shared_by && <span className="text-sm text-gray-500 ml-2">shared by {list.shared_by}</span>}
            </div>
            {list.user_id === userId && (
              <button
                onClick={() => deleteStockList(list.list_id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
          <ul className="ml-4 text-sm text-gray-700">
            {list.items.map((item, i) => (
              <li key={i}>• {item.symbol}: {item.num_shares} shares</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default StockListPanel;
