# Aster Finance MCP Server

[![Powered by Questflow](https://img.shields.io/badge/Powered%20by-Questflow-blue?style=flat-square)](https://questflow.ai)

This project is an MCP (Model Context Protocol) Server that provides a comprehensive set of tools to interact with the [Aster Finance Futures API](https://github.com/asterdex/api-docs/blob/master/aster-finance-futures-api.md). It allows AI agents and other MCP-compatible clients to access market data, manage trades, and query account information on the Aster exchange.

## Features

- **Full REST API Coverage**: Implements all RESTful endpoints from the Aster Futures API documentation (excluding WebSocket streams).
- **Market Data**: Access real-time and historical market data, including order books, trades, klines, and ticker information.
- **Account & Trading**: Full trading capabilities, including placing/canceling orders, managing positions, and checking account balances.
- **Secure**: Uses API keys stored securely as environment variables, never hardcoded.
- **Stdio Transport**: Runs as a standard I/O process, making it easy to integrate with MCP hosts.

## Installation & Configuration

This server is designed to be run by an MCP host environment.

1.  **Install Dependencies & Build**:

    You can use either `npm` or `pnpm` to install the project dependencies and build the server.

    *Using npm:*
    ```bash
    npm install
    npm run build
    ```

    *Or using pnpm:*
    ```bash
    pnpm install
    pnpm run build
    ```

2.  **Configure the MCP Host**:
    Add the following configuration to your MCP settings file (e.g., `cline_mcp_settings.json`). This tells the host how to launch the server and provides the necessary API credentials.

    ```json
    {
      "mcpServers": {
        "aster": {
          "command": "node",
          "args": [
            "/path/to/your/aster-mcp-server/build/index.js"
          ],
          "env": {
            "ASTER_API_KEY": "YOUR_ASTER_API_KEY",
            "ASTER_API_SECRET": "YOUR_ASTER_SECRET_KEY"
          },
          "disabled": false,
          "autoApprove": []
        }
      }
    }
    ```
    Replace `/path/to/your/aster-mcp-server` with the absolute path to this project directory, and fill in your actual `ASTER_API_KEY` and `ASTER_API_SECRET`.

## Available Tools

The server exposes the following tools, categorized by function:

### Market Data Endpoints

| Tool Name          | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `ping`             | Test connectivity to the Rest API.                     |
| `time`             | Get the current server time.                           |
| `exchangeInfo`     | Get current exchange trading rules and symbol info.    |
| `depth`            | Get the order book for a symbol.                       |
| `trades`           | Get recent market trades.                              |
| `historicalTrades` | Get older market historical trades.                    |
| `aggTrades`        | Get compressed, aggregate market trades.               |
| `klines`           | Get Kline/candlestick bars for a symbol.               |
| `indexPriceKlines` | Get Kline/candlestick bars for the index price.        |
| `markPriceKlines`  | Get Kline/candlestick bars for the mark price.         |
| `premiumIndex`     | Get Mark Price and Funding Rate.                       |
| `fundingRate`      | Get funding rate history.                              |
| `fundingInfo`      | Get funding rate configuration.                        |
| `ticker_24hr`      | 24-hour rolling window price change statistics.        |
| `ticker_price`     | Get the latest price for a symbol or symbols.          |
| `ticker_bookTicker`| Get the best price/qty on the order book.              |

### Account & Trade Endpoints

| Tool Name                 | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `setPositionMode`         | Change user's position mode (Hedge vs. One-way).       |
| `getPositionMode`         | Get user's current position mode.                      |
| `setMultiAssetsMode`      | Change user's Multi-Assets mode.                       |
| `getMultiAssetsMode`      | Get user's current Multi-Assets mode.                  |
| `placeOrder`              | Send in a new order.                                   |
| `placeBatchOrders`        | Place multiple orders at once.                         |
| `transferAsset`           | Transfer assets between futures and spot accounts.     |
| `queryOrder`              | Check an order's status.                               |
| `cancelOrder`             | Cancel an active order.                                |
| `cancelAllOpenOrders`     | Cancel all open orders on a symbol.                    |
| `cancelBatchOrders`       | Cancel multiple orders.                                |
| `countdownCancelAll`      | Auto-cancel all open orders after a countdown.         |
| `queryOpenOrder`          | Query a specific open order.                           |
| `getAllOpenOrders`        | Get all open orders on a symbol.                       |
| `getAllOrders`            | Get all account orders (active, canceled, or filled).  |
| `getBalance`              | Get futures account balance.                           |
| `getAccountInfo`          | Get current account information.                       |
| `setLeverage`             | Change initial leverage for a symbol.                  |
| `setMarginType`           | Change margin type (ISOLATED/CROSSED).                 |
| `modifyPositionMargin`    | Modify isolated position margin.                       |
| `getPositionMarginHistory`| Get position margin change history.                    |
| `getPositionInfo`         | Get current position information.                      |
| `getTradeList`            | Get trades for a specific account and symbol.          |
| `getIncomeHistory`        | Get income history.                                    |
| `getLeverageBrackets`     | Get notional and leverage brackets.                    |
| `getAdlQuantile`          | Get Position ADL Quantile Estimation.                  |
| `getForceOrders`          | Get user's force orders (liquidations/ADL).            |
| `getCommissionRate`       | Get user's commission rate for a symbol.               |

## Usage Example

Once the server is running, you can invoke its tools through your MCP client. For example, to get the current server time, you would make a `callTool` request like this:

```json
{
  "server_name": "aster",
  "tool_name": "time",
  "arguments": {}
}
```

To get the order book for BTCUSDT:

```json
{
  "server_name": "aster",
  "tool_name": "depth",
  "arguments": {
    "symbol": "BTCUSDT",
    "limit": 10
  }
}
```

---

*This MCP Server was proudly developed with the assistance of Questflow.*
