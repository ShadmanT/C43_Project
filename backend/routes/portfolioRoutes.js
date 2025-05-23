const express = require('express');
const pool = require('../db/db'); // uses db.js from /db
const router = express.Router();

// Simulate user auth from x-user-id
const getUserId = (req) => parseInt(req.headers['x-user-id']) || 1;

// creating portfolio
// {name}
router.post('/create', async (req, res) => {
  const userId = getUserId(req);
  const { name } = req.body;

  // check inpufs
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Portfolio name is required' });
  }

  try {
    // inserting new portfolio with balance of $0
    const result = await pool.query(
      `INSERT INTO Portfolio (user_id, name, cash_balance)
       VALUES ($1, $2, $3)
       RETURNING portfolio_id`,
      [userId, name.trim(), 0.00]
    );

    // return the portfolio id and a success or error message
    res.status(201).json({
      message: 'Portfolio created',
      portfolioId: result.rows[0].portfolio_id
    });
  } catch (err) {
    console.error('Portfolio creation failed:', err);
    res.status(500).json({ error: 'Failed to create portfolio' });
  }
});
  

  // depositing cash into portfolio
  // { portfolioId, amount }
router.post('/deposit', async (req, res) => {
  const { portfolioId, amount } = req.body;

  // check inputs
  if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
  } 
  if (!portfolioId || isNaN(portfolioId)) {
      return res.status(400).json({ error: 'Invalid portfolioId' });
  }
          
  // adding cash amount to cash_balance of specific portfolio id
  try {
    await pool.query(
      `UPDATE Portfolio SET cash_balance = cash_balance + $1 WHERE portfolio_id = $2`,
      [amount, portfolioId]
    );
    res.status(200).json({ message: `Deposited $${amount}` });
  } catch (err) {
    console.error('Deposit failed:', err);
    res.status(500).json({ error: 'Deposit failed' });
  }
});
  

// withdraw amount from portfolio (subtract cash_balance)
// { portfolioId, amount }
router.post('/withdraw', async (req, res) => {
  const { portfolioId, amount } = req.body;

  // check inputs
  if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
  }
  if (!portfolioId || isNaN(portfolioId)) {
      return res.status(400).json({ error: 'Invalid portfolioId' });
  }

  // check if user has enough money to withdraw their wanted amount
  try {
    const result = await pool.query(
      `SELECT cash_balance FROM Portfolio WHERE portfolio_id = $1`,
      [portfolioId]
    );
    const balance = parseFloat(result.rows[0]?.cash_balance ?? 0);
    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // if user has enough then subtract from cash_balance
    await pool.query(
      `UPDATE Portfolio SET cash_balance = cash_balance - $1 WHERE portfolio_id = $2`,
      [amount, portfolioId]
    );
    res.status(200).json({ message: `Withdrew $${amount}` });
  } catch (err) {
    console.error('Withdraw failed:', err);
    res.status(500).json({ error: 'Withdraw failed' });
  }
});

// allow user to purchase stock to add to their portfolio
// body: { portfolioId, symbol, numShares}
router.post('/add-stock', async (req, res) => {
  const { portfolioId, symbol, numShares } = req.body;
  
  // check inputs
  if (numShares <= 0) {
    return res.status(400).json({ error: 'Number of shares must be greater than 0' });
  }

  // check if the symbol they want to add stock to exists
  const symbolCheck = await pool.query(
    `SELECT symbol FROM Stock WHERE symbol = $1`,
    [symbol]
  );
  if (symbolCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Stock symbol not found' });
  }

  try {
    // get the most recent stock price
    const priceResult = await pool.query(
      `SELECT close FROM StockPrice WHERE symbol = $1 ORDER BY date DESC LIMIT 1`,
      [symbol]
    );
    if (priceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stock price not found' });
    }

    const stockPrice = parseFloat(priceResult.rows[0].close);
    const totalCost = stockPrice * numShares;

    // check if the user has enough money to buy the stock (check cash_balance in their portfolio)
    const cashResult = await pool.query(
      `SELECT cash_balance FROM Portfolio WHERE portfolio_id = $1`,
      [portfolioId]
    );
    const cash = parseFloat(cashResult.rows[0].cash_balance);
    if (cash < totalCost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // update PortfolioHolding
    await pool.query(`
      INSERT INTO PortfolioHolding (portfolio_id, symbol, num_shares)
      VALUES ($1, $2, $3)
      ON CONFLICT (portfolio_id, symbol)
      DO UPDATE SET num_shares = PortfolioHolding.num_shares + $3
    `, [portfolioId, symbol, numShares]);

    // subtract from user's cash_balance
    await pool.query(`
      UPDATE Portfolio SET cash_balance = cash_balance - $1 WHERE portfolio_id = $2
    `, [totalCost, portfolioId]);

    res.status(200).json({ message: 'Stock added successfully' });
  } catch (err) {
    console.error('Add stock failed:', err);
    res.status(500).json({ error: 'Add stock failed' });
  }
});
  

/**
 * GET /portfolio/view
 * Lists portfolios with cash, holdings, and total value
 */
// gets all the user's portfolios, their cash balance, and total market value
router.get('/view', async (req, res) => {
  const userId = getUserId(req);

  try {
    // get all portfolios
    const portfoliosResult = await pool.query(
      `SELECT * FROM Portfolio WHERE user_id = $1`,
      [userId]
    );

    const portfolios = [];

    // get the holdings for all the portfolios
    for (const portfolio of portfoliosResult.rows) {
      const holdingsRes = await pool.query(
          `SELECT h.symbol, h.num_shares, sp.close AS latest_price
            FROM PortfolioHolding h
            JOIN (
              SELECT symbol, close
              FROM StockPrice sp1
              WHERE (symbol, date) IN (
                SELECT symbol, MAX(date) AS latest_date
                FROM StockPrice
                GROUP BY symbol
              )
            ) sp ON sp.symbol = h.symbol
            WHERE h.portfolio_id = $1`,
          [portfolio.portfolio_id]
      );
        
      const holdings = holdingsRes.rows;

      // calculating the total market value
      // for each stock in the portfolio we do (number of shares x latest price per share)
      // then we use that to get the total values of all stocks and add it to the cash balance in portfolio
      let marketValue = 0;
      holdings.forEach(h => {
        marketValue += h.num_shares * parseFloat(h.latest_price);
      });

      // push the portfolio data into an array
      portfolios.push({
        portfolioId: portfolio.portfolio_id,
        name: portfolio.name,
        cash: parseFloat(portfolio.cash_balance),
        holdings,
        totalMarketValue: marketValue + parseFloat(portfolio.cash_balance)
      });
    }

    // return the array of portfolios (with the wanted data and info) or error
    res.json({ portfolios });
  } catch (err) {
    console.error('View portfolio failed:', err);
    res.status(500).json({ error: 'View failed' });
  }
});


// gets the historical close prices of a stock over a given interval
router.get('/history', async (req, res) => {
    const { symbol, interval } = req.query;
  
    //covert intervals to int day values
    const intervalMap = {
      '1week': 7,
      '1month': 30,
      '3months': 90,
      '1year': 365,
      '5years': 1825
    };
    const days = intervalMap[interval];

    // check inputs
    if (!symbol || !days) {
      return res.status(400).json({ error: 'Invalid symbol or interval' });
    }
  
    // getting the historical data of given symbol from the past X days
    try {
        const result = await pool.query(
            `
            SELECT date, close FROM (
              SELECT date, close FROM StockPrice WHERE symbol = $1
              UNION
              SELECT date, close FROM StockPrice WHERE symbol = $1
            ) AS combined
            WHERE date >= DATE '2018-02-07' - ($2 || ' days')::INTERVAL
            ORDER BY date ASC
            `,
            [symbol, days]
        );
          
      res.json({
        symbol,
        interval,
        data: result.rows
      });
    } catch (err) {
      console.error('Historical price fetch failed:', err);
      res.status(500).json({ error: 'Could not retrieve historical prices' });
    }
});

router.get('/stats', async (req, res) => {
  const { portfolioId } = req.query;
  
  // check if we have a valid portfolio ID
  if (!portfolioId || isNaN(portfolioId)) {
    return res.status(400).json({ error: 'Invalid portfolioId' });
  }
  
  // get all symbols in portfolio
  try {
    const symbolsResult = await pool.query(
      `SELECT symbol FROM PortfolioHolding WHERE portfolio_id = $1`,
      [portfolioId]
    );

    const symbols = symbolsResult.rows.map(r => r.symbol); // get each stock symbol from query above
    const stats = {}; // to hold stats per symbol
    const matrix = {}; // will hold correlation matrix bn symbols

    // calculate market average close per day
    // we do this by taking the average of all stock close prices for each data
    const marketRes = await pool.query(`
      SELECT date, AVG(close) AS market_close
      FROM StockPrice
      WHERE close IS NOT NULL
      GROUP BY date
    `);

    // lookup map of market average for a given date
    const marketMap = new Map(marketRes.rows.map(r => [r.date.toISOString().split('T')[0], parseFloat(r.market_close)]));

    // build correlation matrix and compute stats per symbol
    for (let i = 0; i < symbols.length; i++) { // loop through each stock symbol in the portfolio
      const symA = symbols[i];
      stats[symA] = {}; //initialize to store stats for current symbol

      // get price history for the stock, to calculate COV, beta and returns
      const priceRes = await pool.query(`
        SELECT date, close FROM StockPrice
        WHERE symbol = $1 AND close IS NOT NULL
        ORDER BY date
      `, [symA]);

      const returns = []; // for daily returns for the stock
      const marketReturns = []; // to store daily returns for the market

      // compute stock returns and market returns
      for (let j = 1; j < priceRes.rows.length; j++) { // loop through the price history and compute returns
        const prev = priceRes.rows[j - 1]; // previous day price
        const curr = priceRes.rows[j]; // current dat price
        const dateStr = curr.date.toISOString().split('T')[0];
        
        // computing daily log returns for stock and market
        const stockReturn = Math.log(curr.close / prev.close);
        const marketPrev = marketMap.get(prev.date.toISOString().split('T')[0]);
        const marketCurr = marketMap.get(dateStr);

        if (marketPrev && marketCurr && marketPrev > 0 && marketCurr > 0) {
          const marketReturn = Math.log(marketCurr / marketPrev);
          returns.push(stockReturn);
          marketReturns.push(marketReturn);
        }
      }

      // compute average return and standard deviation
      const avg = returns.length > 0 ? (returns.reduce((a, b) => a + b, 0) / returns.length) : 0; // avg return for hte stock
      const std = Math.sqrt(returns.map(r => Math.pow(r - avg, 2)).reduce((a, b) => a + b, 0) / returns.length); // std dev of stock returns

      // COV = std / avg (if avg != 0)
      const cov = avg !== 0 ? std / avg : null;


      // calculating Beta using the correlation with market
      const meanMarket = marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length; // avg returns of the market
      const stdMarket = Math.sqrt(marketReturns.map(r => Math.pow(r - meanMarket, 2)).reduce((a, b) => a + b, 0) / marketReturns.length); // std of market returns

      // correlation between stock and market
      let corr = 0;
      if (returns.length === marketReturns.length && returns.length > 1) {
        const numerator = returns.map((r, i) => (r - avg) * (marketReturns[i] - meanMarket)).reduce((a, b) => a + b, 0);
        const denominator = returns.length * std * stdMarket;
        corr = denominator !== 0 ? numerator / denominator : 0;
      }
      
      // computing beta 
      const beta = corr * (std / stdMarket);

      stats[symA] = {
        average: avg.toFixed(4),
        stddev: std.toFixed(4),
        cov: cov ? cov.toFixed(4) : null,
        beta: isFinite(beta) ? beta.toFixed(4) : null
      };

      // computing row of correlation matrix for symA
      matrix[symA] = {};
      for (let j = 0; j < symbols.length; j++) {
        const symB = symbols[j];
        if (symA === symB) {
          matrix[symA][symB] = "1.0000";
        } else {
          const corrRes = await pool.query(
            `SELECT CORR(a.close, b.close) AS corr
              FROM StockPrice a
              JOIN StockPrice b ON a.date = b.date
              WHERE a.symbol = $1 AND b.symbol = $2 AND a.close IS NOT NULL AND b.close IS NOT NULL`,
            [symA, symB]
          );
          const corrVal = corrRes.rows[0]?.corr;
          matrix[symA][symB] = corrVal !== null && corrVal !== undefined
          ? parseFloat(corrVal).toFixed(4)
          : 'Not Enough Data';
        }
      }
    }

    res.json({
      portfolioId: parseInt(portfolioId),
      stats,
      correlationMatrix: matrix
    });

  } catch (err) {
    console.error('Portfolio stats failed:', err);
    res.status(500).json({ error: 'Could not calculate stats' });
  }
});  


// adds new stock price data
// /api/portfolio/stockprice/add
// { symbol, date, open, high, low, close, volume }
 
router.post('/stockprice/add', async (req, res) => {
    const { symbol, date, open, high, low, close, volume } = req.body;
  
    if (!symbol || !date || !open || !high || !low || !close || !volume) {
      return res.status(400).json({ error: 'All fields required' });
    }
  
    try {
      await pool.query(
        `INSERT INTO StockPrice (symbol, date, open, high, low, close, volume)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [symbol, date, open, high, low, close, volume]
      );
      res.status(201).json({ message: 'Stock data added' });
    } catch (err) {
      console.error('Insert stock data failed:', err);
      res.status(500).json({ error: 'Insert failed' });
    }
});

  
// sells stock from a portfolio and adds proceeds to cash
// body: { portfolioId, symbol, numShares }
// /portfolio/sell-stock
 
router.post('/sell-stock', async (req, res) => {
    const { portfolioId, symbol, numShares } = req.body;

    // check inputs
    if (numShares <= 0) {
        return res.status(400).json({ error: 'Number of shares must be greater than 0' });
    }
    if (!portfolioId || isNaN(portfolioId)) {
        return res.status(400).json({ error: 'Invalid portfolioId' });
    }
      
  
    try {
      // get number of shares owned
      const holdingResult = await pool.query(
        `SELECT num_shares FROM PortfolioHolding WHERE portfolio_id = $1 AND symbol = $2`,
        [portfolioId, symbol]
      );

      // if the user doesn't own the share or are trying to sell more than they have return an error
      if (holdingResult.rows.length === 0 || holdingResult.rows[0].num_shares < numShares) {
        return res.status(400).json({ error: 'Insufficient shares to sell' });
      }
  
      // get latest stock price
      const priceResult = await pool.query(
        `SELECT close FROM StockPrice WHERE symbol = $1 ORDER BY date DESC LIMIT 1`,
        [symbol]
      );

      // calculate total money earned from selling shares
      const stockPrice = parseFloat(priceResult.rows[0]?.close ?? 0);
      const totalProceeds = stockPrice * numShares;
  
      // subtract shares that were sold from their holdings
      await pool.query(
        `UPDATE PortfolioHolding
         SET num_shares = num_shares - $1
         WHERE portfolio_id = $2 AND symbol = $3`,
        [numShares, portfolioId, symbol]
      );
  
      // remove row if shares drop to 0
      await pool.query(
        `DELETE FROM PortfolioHolding WHERE portfolio_id = $1 AND symbol = $2 AND num_shares <= 0`,
        [portfolioId, symbol]
      );
  
      // update their cash balance
      await pool.query(
        `UPDATE Portfolio SET cash_balance = cash_balance + $1 WHERE portfolio_id = $2`,
        [totalProceeds, portfolioId]
      );
  
      res.status(200).json({ message: 'Stock sold successfully', proceeds: totalProceeds.toFixed(2) });
    } catch (err) {
      console.error('Sell stock failed:', err);
      res.status(500).json({ error: 'Sell stock failed' });
    }
});  

// returns linear regression-based close price prediction
// /api/portfolio/predict?symbol=AAPL&days=30

router.get('/predict', async (req, res) => {
  const { symbol, days } = req.query;
  const numDays = parseInt(days) || 30;

  // check if symbol is chosen
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol required' });
  }

  // get all the historical data for the stock
  try {
    const result = await pool.query(
      `SELECT date, close
       FROM StockPrice
       WHERE symbol = $1
       ORDER BY date ASC`,
      [symbol]
    );

    const rows = result.rows;
    if (rows.length < 2) {
      return res.status(400).json({ error: 'Not enough data for prediction' });
    }

    // convert each date into a number (x) representing days since the first entry
    // we let the close price be y
    const baseDate = new Date(rows[0].date);
    const data = rows.map((r, i) => ({
      x: (new Date(r.date) - baseDate) / (1000 * 60 * 60 * 24), 
      y: parseFloat(r.close)
    }));

    // computing linear regression: y = a + b * x
    const n = data.length; // getting the number of data points
    const sumX = data.reduce((acc, pt) => acc + pt.x, 0); // getting the sum of all x
    const sumY = data.reduce((acc, pt) => acc + pt.y, 0); // getting the sum of all y
    const sumXY = data.reduce((acc, pt) => acc + pt.x * pt.y, 0); // getting the sum of corresponding x and y
    const sumX2 = data.reduce((acc, pt) => acc + pt.x * pt.x, 0); // getting the sum of the x squares

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX); 
    const intercept = (sumY - slope * sumX) / n; 

    // predicting future close prices
    const lastDayOffset = data[data.length - 1].x;
    const predicted = [];

    for (let i = 1; i <= numDays; i++) {
      const futureOffset = lastDayOffset + i;
      const predictedClose = intercept + slope * futureOffset;

      const futureDate = new Date(baseDate);
      futureDate.setDate(baseDate.getDate() + futureOffset);

      predicted.push({
        date: futureDate.toISOString().split('T')[0],
        close: parseFloat(predictedClose.toFixed(2))
      });
    }

    res.json({ symbol, predicted });
  } catch (err) {
    console.error('Prediction failed:', err);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

router.post('/stock/user-add', async (req, res) => {
  const { symbol, company_name, date, open, high, low, close, volume } = req.body;

  if (!symbol || !company_name || !date || !open || !high || !low || !close || !volume) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const upperSymbol = symbol.toUpperCase();

    // checking if company already exists under a different symbol
    const nameCheck = await client.query(
      `SELECT symbol FROM Stock WHERE LOWER(company_name) = LOWER($1)`,
      [company_name]
    );

    if (nameCheck.rows.length > 0 && nameCheck.rows[0].symbol !== upperSymbol) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Company '${company_name}' is already registered under the symbol '${nameCheck.rows[0].symbol}'.`
      });
    }

    // checking if symbol already exists with a different company
    const symbolCheck = await client.query(
      `SELECT company_name FROM Stock WHERE symbol = $1`,
      [upperSymbol]
    );

    if (symbolCheck.rows.length > 0) {
      const existingName = symbolCheck.rows[0].company_name;
      if (existingName.toLowerCase() !== company_name.toLowerCase()) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Symbol '${upperSymbol}' is already registered to '${existingName}', not '${company_name}'.`
        });
      }
    }

    // inserting stock if it doesn't already exist
    if (symbolCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO Stock (symbol, company_name)
         VALUES ($1, $2)`,
        [upperSymbol, company_name]
      );
    }

    // inserting stock price
    await client.query(
      `INSERT INTO StockPrice (symbol, date, open, high, low, close, volume)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [upperSymbol, date, open, high, low, close, volume]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Stock and price data added' });

  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Duplicate price entry for this symbol/date' });
    }
    console.error('Full stock add failed:', err);
    res.status(500).json({ error: 'Failed to add stock and price data' });
  } finally {
    client.release();
  }
});

module.exports = router;
