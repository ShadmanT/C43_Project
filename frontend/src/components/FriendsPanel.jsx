import { useEffect, useState } from 'react';
import axios from 'axios';

const FriendsPanel = ({ userId }) => {
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [requestInput, setRequestInput] = useState('');
  const [unfriendTarget, setUnfriendTarget] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchFriends = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/friends', {
        headers: { 'x-user-id': userId }
      });
      setFriends(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch friends:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/friends/requests', {
        headers: { 'x-user-id': userId }
      });
      setIncomingRequests(res.data.incoming || []);
      setOutgoingRequests(res.data.outgoing || []);
    } catch (err) {
      console.error('❌ Failed to fetch friend requests:', err);
    }
  };

  const sendRequest = async () => {
    try {
      await axios.post(
        'http://localhost:3000/api/friends/request',
        { receiverId: parseInt(requestInput) },
        { headers: { 'x-user-id': userId } }
      );
      alert('Request sent!');
      setRequestInput('');
      await fetchRequests();
      await fetchFriends(); // refresh friends too
    } catch (err) {
      console.error('❌ Failed to send request:', err);
      alert('Failed to send request');
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      await axios.post(
        'http://localhost:3000/api/friends/respond',
        { requestId, action },
        { headers: { 'x-user-id': userId } }
      );
      await fetchFriends();
      await fetchRequests();
    } catch (err) {
      console.error('❌ Failed to respond to friend request:', err);
      alert('Failed to respond');
    }
  };

  const confirmUnfriend = async () => {
    if (!unfriendTarget) return;
    try {
      await axios.delete(`http://localhost:3000/api/friends/${unfriendTarget.user_id}`, {
        headers: { 'x-user-id': userId }
      });
      setShowModal(false);
      setUnfriendTarget(null);
      await fetchFriends();
    } catch (err) {
      console.error('❌ Failed to unfriend:', err);
      alert('Failed to unfriend');
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, [userId]);

  return (
    <div className="p-4 border rounded-lg shadow space-y-4 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold">Friends</h2>

      {/* Current Friends */}
      <div>
        <h3 className="font-semibold mb-1">Your Friends:</h3>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-500">No friends yet.</p>
        ) : (
          friends.map((f) => (
            <div key={f.user_id} className="flex justify-between items-center mb-1">
              <span>{f.username} (ID: {f.user_id})</span>
              <button
                onClick={() => {
                  setUnfriendTarget(f);
                  setShowModal(true);
                }}
                className="text-red-500 hover:underline text-sm"
              >
                Unfriend
              </button>
            </div>
          ))
        )}
      </div>

      {/* Send Request */}
      <div>
        <h3 className="font-semibold mb-1">Send Friend Request:</h3>
        <input
          type="number"
          placeholder="Enter user ID"
          value={requestInput}
          onChange={(e) => setRequestInput(e.target.value)}
          className="border p-1 mr-2 w-40"
        />
        <button
          onClick={sendRequest}
          disabled={!requestInput.trim()}
          className="bg-blue-500 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {/* Incoming Requests */}
      <div>
        <h3 className="font-semibold mb-1">Incoming Requests:</h3>
        {incomingRequests.length === 0 ? (
          <p className="text-sm text-gray-500">None</p>
        ) : (
          incomingRequests.map((r) => (
            <div key={r.request_id} className="flex justify-between items-center mb-1">
              <span>From {r.sender_username} (ID: {r.sender_id})</span>
              <div className="space-x-2">
                <button
                  onClick={() => respondToRequest(r.request_id, 'accept')}
                  className="text-green-600 hover:underline text-sm"
                >
                  Accept
                </button>
                <button
                  onClick={() => respondToRequest(r.request_id, 'reject')}
                  className="text-red-500 hover:underline text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Outgoing Requests */}
      <div>
        <h3 className="font-semibold mb-1">Outgoing Requests:</h3>
        {outgoingRequests.length === 0 ? (
          <p className="text-sm text-gray-500">None</p>
        ) : (
          outgoingRequests.map((r) => (
            <p key={r.request_id} className="text-sm">
              To {r.receiver_username} (ID: {r.receiver_id}) — pending
            </p>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && unfriendTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white text-black p-6 rounded shadow-lg w-80">
            <h4 className="font-bold mb-3">Confirm Unfriend</h4>
            <p>
              Are you sure you want to unfriend {unfriendTarget.username} (ID: {unfriendTarget.user_id})?
            </p>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setUnfriendTarget(null);
                }}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button onClick={confirmUnfriend} className="bg-red-500 text-white px-3 py-1 rounded">
                Unfriend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsPanel;
