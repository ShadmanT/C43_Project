-- Drop existing tables in correct order to avoid FK conflicts
DROP TABLE IF EXISTS FriendsWith, FriendRequest, Review, StockListItem, StockList, StockPrice, Stock, PortfolioHolding, Portfolio, UserAccount CASCADE;

-- User Table
CREATE TABLE UserAccount (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio Table
CREATE TABLE Portfolio (
    portfolio_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES UserAccount(user_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    cash_balance NUMERIC(12, 2) DEFAULT 0.00
);

-- PortfolioHolding Table
CREATE TABLE PortfolioHolding (
    portfolio_id INTEGER REFERENCES Portfolio(portfolio_id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    num_shares INTEGER NOT NULL,
    PRIMARY KEY (portfolio_id, symbol)
);

-- Stock Table
CREATE TABLE Stock (
    symbol VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(100)
);

-- StockPrice Table
CREATE TABLE StockPrice (
    date DATE,
    open NUMERIC,
    high NUMERIC,
    low NUMERIC,
    close NUMERIC,
    volume BIGINT,
    symbol TEXT,
    PRIMARY KEY (symbol, date)
);

-- StockList Table
CREATE TABLE StockList (
    list_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES UserAccount(user_id) ON DELETE CASCADE,
    list_name VARCHAR(50) NOT NULL,
    visibility VARCHAR(20) DEFAULT 'private'
);

-- StockListItem Table
CREATE TABLE StockListItem (
    list_id INTEGER REFERENCES StockList(list_id) ON DELETE CASCADE,
    symbol VARCHAR(10) REFERENCES Stock(symbol) ON DELETE CASCADE,
    num_shares INTEGER NOT NULL,
    PRIMARY KEY (list_id, symbol)
);

-- StockListShare Table
CREATE TABLE StockListShare (
    list_id INTEGER REFERENCES StockList(list_id) ON DELETE CASCADE,
    shared_with INTEGER REFERENCES UserAccount(user_id) ON DELETE CASCADE,
    PRIMARY KEY (list_id, shared_with)
);

-- Review Table
CREATE TABLE Review (
    review_id SERIAL PRIMARY KEY,
    list_id INTEGER REFERENCES StockList(list_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES UserAccount(user_id) ON DELETE CASCADE,
    content TEXT,
    last_edit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_list_review UNIQUE (list_id, user_id)
);


-- FriendRequest Table
CREATE TABLE FriendRequest (
    request_id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES UserAccount(user_id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES UserAccount(user_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending'
);

-- FriendsWith Table
CREATE TABLE FriendsWith (
    user_id1 INTEGER REFERENCES UserAccount(user_id) ON DELETE CASCADE,
    user_id2 INTEGER REFERENCES UserAccount(user_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id1, user_id2)
);