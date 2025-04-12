import { useEffect, useState } from 'react';
import axios from 'axios';

const ShareListsWithFriends = ({ userId, ownedLists, refreshLists }) => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedLists, setSelectedLists] = useState([]);

  useEffect(() => {
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

    fetchFriends();
  }, [userId]);

  const toggleSelection = (id, setFn, currentSelection) => {
    if (currentSelection.includes(id)) {
      setFn(currentSelection.filter(x => x !== id));
    } else {
      setFn([...currentSelection, id]);
    }
  };

  const shareLists = async () => {
    let successCount = 0;
    let failCount = 0;

    for (const listId of selectedLists) {
      for (const friendId of selectedFriends) {
        try {
          const res = await axios.post(
            `http://localhost:3000/api/stocklists/${listId}/share-with-friend`,
            { friendId },
            { headers: { 'x-user-id': userId } }
          );

          if (res.status === 200) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`Failed to share list ${listId} with user ${friendId}`, err);
          failCount++;
        }
      }
    }

    await refreshLists();

    if (successCount > 0) {
      alert(`Successfully shared ${successCount} item(s).`);
    }

    if (failCount > 0) {
      alert(`Failed to share ${failCount} item(s). Check the console for details.`);
    }

    setSelectedFriends([]);
    setSelectedLists([]);
  };

  const filteredLists = ownedLists.filter(
    list => list.user_id === userId && list.visibility === 'private'
  );

  return (
    <div className="p-4 border rounded shadow mb-4 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">Share Lists With Friends</h2>

      <div className="mb-4">
        <h3 className="font-semibold">Select Friends:</h3>
        {friends.map(friend => (
          <div key={friend.user_id}>
            <label>
              <input
                type="checkbox"
                checked={selectedFriends.includes(friend.user_id)}
                onChange={() => toggleSelection(friend.user_id, setSelectedFriends, selectedFriends)}
              />{' '}
              {friend.username}
            </label>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Select Lists:</h3>
        {filteredLists.length === 0 ? (
          <p className="text-sm text-gray-500">No private lists available to share.</p>
        ) : (
          filteredLists.map(list => (
            <div key={list.list_id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedLists.includes(list.list_id)}
                  onChange={() => toggleSelection(list.list_id, setSelectedLists, selectedLists)}
                />{' '}
                {list.list_name} ({list.visibility})
              </label>
            </div>
          ))
        )}
      </div>

      <button
        onClick={shareLists}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={selectedFriends.length === 0 || selectedLists.length === 0}
      >
        Share Selected
      </button>
    </div>
  );
};

export default ShareListsWithFriends;
