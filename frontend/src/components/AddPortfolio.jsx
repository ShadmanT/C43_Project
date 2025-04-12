import { useState } from 'react';
import axios from 'axios';

const AddPortfolio = ({ userId, onCreate }) => {
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Portfolio name cannot be empty.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:3000/api/portfolio/create', { name }, {
        headers: { 'x-user-id': userId }
      });
      alert('Portfolio created!');
      setName('');
      if (onCreate) onCreate(); // refresh portfolio list if provided
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to create portfolio.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      <h3>Create New Portfolio</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Portfolio Name"
        required
      />
      <button type="submit">Create</button>
    </form>
  );
};

export default AddPortfolio;