import AddStockData from '../components/AddStockData';

const AddStockPage = ({ userId }) => (
  <div>
    <h2>Add Stock + Price Data</h2>
    <AddStockData userId={userId} />
  </div>
);

export default AddStockPage;