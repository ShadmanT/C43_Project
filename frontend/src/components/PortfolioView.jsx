const PortfolioView = ({ portfolios }) => {
  return (
    <div>
      <h2>Your Portfolios</h2>
      {portfolios.map((p) => (
        <div key={p.portfolioId} style={{ border: '1px solid black', padding: '10px', marginBottom: '10px' }}>
          <h3>{p.name}</h3>
          <p><strong>Cash:</strong> ${p.cash.toFixed(2)}</p>
          <p><strong>Total Market Value:</strong> ${p.totalMarketValue.toFixed(2)}</p>
          <h4>Holdings:</h4>
          <ul>
            {p.holdings.map((h, i) => (
              <li key={i}>
                {h.symbol} — {h.num_shares} shares @ ${parseFloat(h.latest_price).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PortfolioView;