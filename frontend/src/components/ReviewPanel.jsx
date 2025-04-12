import { useEffect, useState } from 'react';
import axios from 'axios';

const ReviewPanel = ({ userId, listId }) => {
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState('');
  const [editing, setEditing] = useState(false);
  const [reviewId, setReviewId] = useState(null);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [listId]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/reviews/${listId}`, {
        headers: { 'x-user-id': userId },
      });

      const sorted = res.data.sort((a, b) => new Date(b.last_edit) - new Date(a.last_edit));
      setReviews(sorted);

      const mine = sorted.find((r) => r.user_id === userId);
      if (mine) {
        setMyReview(mine.content);
        setReviewId(mine.review_id);
        setEditing(true);
      } else {
        setMyReview('');
        setReviewId(null);
        setEditing(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Not authorized or list does not exist');
    }
  };

  const handleSubmit = async () => {
    if (!myReview.trim()) return;

    try {
      await axios.post(
        'http://localhost:3000/api/reviews',
        { listId, content: myReview },
        { headers: { 'x-user-id': userId } }
      );
      await fetchReviews();
      setEditing(true);
      setCollapsed(false);
    } catch {
      alert('Could not submit review');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/reviews/${reviewId}`, {
        headers: { 'x-user-id': userId },
      });
      setMyReview('');
      setReviewId(null);
      setEditing(false);
      await fetchReviews();
    } catch {
      alert('Could not delete review');
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-300">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Reviews</h3>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-sm text-blue-600 hover:underline"
        >
          {collapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {!collapsed && (
        <>
          {error ? (
            <p className="text-red-600 text-sm">{error}</p>
          ) : (
            <>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-600 mb-4">No reviews yet.</p>
              ) : (
                <ul className="text-sm text-black space-y-4 mb-4">
                  {reviews.map((r) => (
                    <li key={r.review_id} className="pb-2 border-b border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{r.username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(r.last_edit).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1">{r.content}</p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2">
                <textarea
                  value={myReview}
                  onChange={(e) => setMyReview(e.target.value)}
                  rows={3}
                  placeholder="Leave a review..."
                  className="w-full border border-gray-300 rounded p-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    {editing ? 'Update Review' : 'Submit Review'}
                  </button>
                  {editing && (
                    <button
                      onClick={handleDelete}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewPanel;
