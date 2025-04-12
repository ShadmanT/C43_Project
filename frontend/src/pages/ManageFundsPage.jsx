import ManageFundsForm from '../components/ManageFunds';

const ManageFundsPage = ({ userId, portfolios, refreshPortfolios }) => (
  <div>
    <h2>Manage Funds</h2>
    <ManageFundsForm userId={userId} portfolios={portfolios} refreshPortfolios={refreshPortfolios} />
  </div>
);

export default ManageFundsPage;