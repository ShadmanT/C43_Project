import { useState } from 'react';
import axios from 'axios';

const AddStockData = ({ userId, onStockAdded }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    company_name: '',
    date: '',
    open: '',
    high: '',
    low: '',
    close: '',
    volume: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddStock = async (e) => {
    e.preventDefault();

    const { open, high, low, close, volume } = formData;
    const numericFields = [open, high, low, close, volume];

    if (numericFields.some(val => parseFloat(val) <= 0 || isNaN(parseFloat(val)))) {
      alert('Numeric fields must be positive numbers.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:3000/api/portfolio/stock/user-add', formData, {
        headers: {
          'x-user-id': userId
        }
      });
      alert(res.data.message);
      if (onStockAdded) onStockAdded(); // trigger parent refresh
    } catch (err) {
      const msg = err?.response?.data?.error;
      alert(msg || 'Failed to add stock data.');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleAddStock}>
      <h3>Add Stock & Price Data</h3>
      <input name="symbol" placeholder="Symbol" onChange={handleChange} required /><br />
      <input name="company_name" placeholder="Company Name" onChange={handleChange} required /><br />
      <input name="date" type="date" onChange={handleChange} required /><br />
      <input name="open" type="number" step="0.01" placeholder="Open" onChange={handleChange} required /><br />
      <input name="high" type="number" step="0.01" placeholder="High" onChange={handleChange} required /><br />
      <input name="low" type="number" step="0.01" placeholder="Low" onChange={handleChange} required /><br />
      <input name="close" type="number" step="0.01" placeholder="Close" onChange={handleChange} required /><br />
      <input name="volume" type="number" placeholder="Volume" onChange={handleChange} required /><br />
      <button type="submit">Submit</button>
    </form>
  );
};

export default AddStockData;