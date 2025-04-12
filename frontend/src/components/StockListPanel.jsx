import { useEffect, useState } from 'react';
import axios from 'axios';
import ReviewPanel from './ReviewPanel';

const StockListPanel = ({ userId, ownedLists, sharedLists, refreshLists }) => {
  const [listName, setListName] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [items, setItems] = useState('');
  const [friends, setFriends] = useState([]);
  const [shareTargets, setShareTargets] = useState({});

  const parsedUserId = parseInt(userId);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/friends', {
        headers: { 'x-user-id': userId }
      });
      setFriends(res.data);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  };

  const createStockList = async () => {
    try {
      const parsedItems = items.split(',').map(s => {
        const [symbol, num] = s.trim().split(':');
        return { symbol, num_shares: parseInt(num) };
      });

      const res = await axios.post('http://localhost:3000/api/stocklists', {
        list_name: listName,
        visibility,
        items: parsedItems
      }, {
        headers: { 'x-user-id': userId }
      });

      if (res.status === 201 || res.status === 200) {
        setListName('');
        setItems('');
        await refreshLists();
      } else {
        alert('Unexpected response while creating list.');
      }
    } catch (err) {
      console.error('❌ Create list failed:', err.response?.data || err.message);
      alert(`Failed to create list: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const deleteStockList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list?')) return;

    try {
      const res = await axios.delete(`http://localhost:3000/api/stocklists/${listId}`, {
        headers: { 'x-user-id': userId }
      });

      if (res.status === 204 || res.status === 200) {
        await refreshLists();
      } else {
        alert('Unexpected response while deleting.');
      }
    } catch (err) {
      console.error('❌ Delete failed:', err.response?.data || err.message);
      alert(`Failed to delete list: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const shareListWithFriend = async (listId) => {
    const friendId = shareTargets[listId];
    if (!friendId) return;

    try {
      const res = await axios.post(`http://localhost:3000/api/stocklists/${listId}/share-with-friend`, {
        friendId
      }, {
        headers: { 'x-user-id': userId }
      });

      if (res.status === 200) {
        alert('List shared successfully!');
        await refreshLists();
      } else {
        alert('Unexpected response while sharing list.');
      }
    } catch (err) {
      console.error('❌ Share failed:', err.response?.data || err.message);
      alert(`Failed to share list: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const updateVisibility = async (listId, newVisibility) => {
    try {
      const res = await axios.put(`http://localhost:3000/api/stocklists/${listId}/visibility`, {
        visibility: newVisibility
      }, {
        headers: { 'x-user-id': userId }
      });

      if (res.status === 200) {
        await refreshLists();
      } else {
        alert('Unexpected response while updating visibility.');
      }
    } catch (err) {
      console.error('❌ Update visibility failed:', err.response?.data || err.message);
      alert(`Failed to update visibility: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const combinedLists = [...ownedLists, ...sharedLists];
  const grouped = {};

  combinedLists.forEach(item => {
    if (!grouped[item.list_id]) {
      grouped[item.list_id] = {
        list_id: item.list_id,
        list_name: item.list_name,
        visibility: item.visibility,
        user_id: item.user_id,
        shared_by: item.shared_by,
        owner_username: item.shared_by || null,
        items: []
      };
    }

    if (item.symbol && item.num_shares) {
      const exists = grouped[item.list_id].items.some(i => i.symbol === item.symbol);
      if (!exists) {
        grouped[item.list_id].items.push({ symbol: item.symbol, num_shares: item.num_shares });
      }
    }
  });

  const groupedArray = Object.values(grouped);
  const yourLists = groupedArray.filter(list => list.user_id === parsedUserId);
  const otherLists = groupedArray.filter(list => list.user_id !== parsedUserId);

  const renderList = (list) => (
    <div key={list.list_id} className="mb-8 p-4 border border-gray-600 rounded-xl shadow-lg bg-[#1e1e1e]">
      <div className="flex justify-between items-center">
        <div>
          <strong>{list.list_name}</strong> ({list.visibility})
          {list.user_id !== parsedUserId && (
            <span className="ml-2 text-sm text-gray-400">
              owned by {list.owner_username || 'unknown'}
            </span>
          )}
        </div>
        {list.user_id === parsedUserId && (
          <button onClick={() => deleteStockList(list.list_id)} className="text-red-500 hover:underline">
            Delete
          </button>
        )}
      </div>

      <ul className="ml-4 text-sm text-gray-300 mt-2">
        {list.items.map((item, idx) => (
          <li key={idx}>• {item.symbol}: {item.num_shares} shares</li>
        ))}
      </ul>

      {list.user_id === parsedUserId && (
        <div className="mt-4 text-sm flex flex-col gap-3">
          <div>
            <label className="mr-2">Change visibility:</label>
            <select
              value={list.visibility}
              onChange={(e) => updateVisibility(list.list_id, e.target.value)}
              className="border p-1 text-sm"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          {list.visibility !== 'public' && (
            <div>
              <label className="mr-2">Share with:</label>
              <select
                value={shareTargets[list.list_id] || ''}
                onChange={(e) =>
                  setShareTargets(prev => ({ ...prev, [list.list_id]: e.target.value }))
                }
                className="border p-1 mr-2"
              >
                <option value="">Select friend</option>
                {friends.map(f => (
                  <option key={f.user_id} value={f.user_id}>
                    {f.username} (ID: {f.user_id})
                  </option>
                ))}
              </select>
              <button
                onClick={() => shareListWithFriend(list.list_id)}
                className="bg-green-500 text-white px-2 py-1 rounded"
              >
                Share
              </button>
            </div>
          )}
        </div>
      )}

      {list.visibility !== 'private' && (
        <ReviewPanel userId={parsedUserId} listId={list.list_id} />
      )}
    </div>
  );

  return (
    <div className="p-4 border rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold">Create a Stock List</h2>

      <div className="mb-6">
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

      <h2 className="text-lg font-semibold mb-2">Your Stock Lists</h2>
      {yourLists.length === 0 ? (
        <p className="text-sm text-gray-500">You have no stock lists created.</p>
      ) : (
        yourLists.map(renderList)
      )}

      <h2 className="text-lg font-semibold mt-6 mb-2">Other Stock Lists</h2>
      {otherLists.length === 0 ? (
        <p className="text-sm text-gray-500">No shared or public stock lists to show.</p>
      ) : (
        otherLists.map(renderList)
      )}
    </div>
  );
};

export default StockListPanel;
