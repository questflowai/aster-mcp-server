#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as crypto from "crypto";
import express from "express";

// The AsterServer class encapsulates the MCP server logic and tool definitions.
class AsterServer {
  private server: Server;
  private axiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: "aster-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: "https://fapi.asterdex.com",
    });

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
  }

  // Sets up handlers for listing and calling tools.
  private setupToolHandlers() {
    // Handler for listing available tools.
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Market Data
          {
            name: "ping",
            description: "Test connectivity to the Rest API.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "time",
            description: "Get the current server time.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "exchangeInfo",
            description:
              "Get current exchange trading rules and symbol information.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "depth",
            description: "Get the order book for a symbol.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: {
                  type: "string",
                  description: "Trading symbol, e.g., BTCUSDT",
                },
                limit: {
                  type: "number",
                  description: "Number of results. Default 500, max 1000.",
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "trades",
            description: "Get recent market trades.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                limit: {
                  type: "number",
                  description: "Number of results. Default 500, max 1000.",
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "historicalTrades",
            description: "Get older market historical trades.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                limit: {
                  type: "number",
                  description: "Number of results. Default 500, max 1000.",
                },
                fromId: {
                  type: "number",
                  description: "TradeId to fetch from.",
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "aggTrades",
            description: "Get compressed, aggregate market trades.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                fromId: {
                  type: "number",
                  description: "ID to get aggregate trades from INCLUSIVE.",
                },
                startTime: {
                  type: "number",
                  description:
                    "Timestamp in ms to get aggregate trades from INCLUSIVE.",
                },
                endTime: {
                  type: "number",
                  description:
                    "Timestamp in ms to get aggregate trades until INCLUSIVE.",
                },
                limit: {
                  type: "number",
                  description: "Number of results. Default 500, max 1000.",
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "klines",
            description: "Get Kline/candlestick bars for a symbol.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                interval: {
                  type: "string",
                  description: "Kline interval (e.g., 1m, 5m, 1h, 1d)",
                },
                startTime: { type: "number", description: "Start time in ms" },
                endTime: { type: "number", description: "End time in ms" },
                limit: {
                  type: "number",
                  description: "Number of results. Default 500, max 1500.",
                },
              },
              required: ["symbol", "interval"],
            },
          },
          {
            name: "indexPriceKlines",
            description:
              "Kline/candlestick bars for the index price of a pair.",
            inputSchema: {
              type: "object",
              properties: {
                pair: {
                  type: "string",
                  description: "Trading pair, e.g., BTCUSDT",
                },
                interval: { type: "string", description: "Kline interval" },
                startTime: { type: "number", description: "Start time in ms" },
                endTime: { type: "number", description: "End time in ms" },
                limit: {
                  type: "number",
                  description: "Number of results. Default 500, max 1500.",
                },
              },
              required: ["pair", "interval"],
            },
          },
          {
            name: "markPriceKlines",
            description:
              "Kline/candlestick bars for the mark price of a symbol.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                interval: { type: "string", description: "Kline interval" },
                startTime: { type: "number", description: "Start time in ms" },
                endTime: { type: "number", description: "End time in ms" },
                limit: {
                  type: "number",
                  description: "Number of results. Default 500, max 1500.",
                },
              },
              required: ["symbol", "interval"],
            },
          },
          {
            name: "premiumIndex",
            description: "Get Mark Price and Funding Rate.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
              },
            },
          },
          {
            name: "fundingRate",
            description: "Get funding rate history.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
                startTime: { type: "number", description: "Start time in ms" },
                endTime: { type: "number", description: "End time in ms" },
                limit: {
                  type: "number",
                  description: "Number of results. Default 100, max 1000.",
                },
              },
            },
          },
          {
            name: "fundingInfo",
            description: "Get funding rate config.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
              },
            },
          },
          {
            name: "ticker_24hr",
            description: "24 hour rolling window price change statistics.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
              },
            },
          },
          {
            name: "ticker_price",
            description: "Latest price for a symbol or symbols.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
              },
            },
          },
          {
            name: "ticker_bookTicker",
            description:
              "Best price/qty on the order book for a symbol or symbols.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string", description: "Trading symbol" },
              },
            },
          },
          // Account/Trades
          {
            name: "setPositionMode",
            description:
              "Change user's position mode (Hedge Mode or One-way Mode).",
            inputSchema: {
              type: "object",
              properties: {
                dualSidePosition: {
                  type: "string",
                  description:
                    '"true" for Hedge Mode; "false" for One-way Mode',
                },
              },
              required: ["dualSidePosition"],
            },
          },
          {
            name: "getPositionMode",
            description: "Get user's position mode.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "setMultiAssetsMode",
            description: "Change user's Multi-Assets mode.",
            inputSchema: {
              type: "object",
              properties: {
                multiAssetsMargin: {
                  type: "string",
                  description:
                    '"true" for Multi-Assets Mode; "false" for Single-Asset Mode',
                },
              },
              required: ["multiAssetsMargin"],
            },
          },
          {
            name: "getMultiAssetsMode",
            description: "Get user's Multi-Assets mode.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "placeOrder",
            description: "Send in a new order.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                side: { type: "string", enum: ["BUY", "SELL"] },
                positionSide: {
                  type: "string",
                  enum: ["BOTH", "LONG", "SHORT"],
                },
                type: {
                  type: "string",
                  enum: [
                    "LIMIT",
                    "MARKET",
                    "STOP",
                    "STOP_MARKET",
                    "TAKE_PROFIT",
                    "TAKE_PROFIT_MARKET",
                    "TRAILING_STOP_MARKET",
                  ],
                },
                timeInForce: {
                  type: "string",
                  enum: ["GTC", "IOC", "FOK", "GTX"],
                },
                quantity: { type: "number" },
                price: { type: "number" },
                stopPrice: { type: "number" },
              },
              required: ["symbol", "side", "type"],
            },
          },
          {
            name: "placeBatchOrders",
            description: "Place multiple orders.",
            inputSchema: {
              type: "object",
              properties: {
                batchOrders: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      symbol: { type: "string" },
                      side: { type: "string", enum: ["BUY", "SELL"] },
                      type: { type: "string" },
                      quantity: { type: "number" },
                      price: { type: "number" },
                    },
                    required: ["symbol", "side", "type", "quantity"],
                  },
                },
              },
              required: ["batchOrders"],
            },
          },
          {
            name: "transferAsset",
            description: "Transfer between futures and spot.",
            inputSchema: {
              type: "object",
              properties: {
                asset: { type: "string" },
                amount: { type: "number" },
                clientTranId: { type: "string" },
                kindType: {
                  type: "string",
                  enum: ["FUTURE_SPOT", "SPOT_FUTURE"],
                },
              },
              required: ["asset", "amount", "clientTranId", "kindType"],
            },
          },
          {
            name: "queryOrder",
            description: "Check an order's status.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                orderId: { type: "number" },
                origClientOrderId: { type: "string" },
              },
              required: ["symbol"],
            },
          },
          {
            name: "cancelOrder",
            description: "Cancel an active order.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                orderId: { type: "number" },
                origClientOrderId: { type: "string" },
              },
              required: ["symbol"],
            },
          },
          {
            name: "cancelAllOpenOrders",
            description: "Cancel all open orders on a symbol.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
              },
              required: ["symbol"],
            },
          },
          {
            name: "cancelBatchOrders",
            description: "Cancel multiple orders.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                orderIdList: { type: "array", items: { type: "number" } },
                origClientOrderIdList: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["symbol"],
            },
          },
          {
            name: "countdownCancelAll",
            description: "Auto-cancel all open orders.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                countdownTime: {
                  type: "number",
                  description: "Countdown time in milliseconds.",
                },
              },
              required: ["symbol", "countdownTime"],
            },
          },
          {
            name: "queryOpenOrder",
            description: "Query current open order.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                orderId: { type: "number" },
                origClientOrderId: { type: "string" },
              },
              required: ["symbol"],
            },
          },
          {
            name: "getAllOpenOrders",
            description: "Get all open orders on a symbol.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
              },
            },
          },
          {
            name: "getAllOrders",
            description: "Get all account orders; active, canceled, or filled.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                orderId: { type: "number" },
                startTime: { type: "number" },
                endTime: { type: "number" },
                limit: { type: "number" },
              },
              required: ["symbol"],
            },
          },
          {
            name: "getBalance",
            description: "Get futures account balance.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "getAccountInfo",
            description: "Get current account information.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "setLeverage",
            description: "Change user's initial leverage.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                leverage: { type: "number", minimum: 1, maximum: 125 },
              },
              required: ["symbol", "leverage"],
            },
          },
          {
            name: "setMarginType",
            description: "Change margin type.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                marginType: { type: "string", enum: ["ISOLATED", "CROSSED"] },
              },
              required: ["symbol", "marginType"],
            },
          },
          {
            name: "modifyPositionMargin",
            description: "Modify isolated position margin.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                positionSide: {
                  type: "string",
                  enum: ["BOTH", "LONG", "SHORT"],
                },
                amount: { type: "number" },
                type: {
                  type: "number",
                  enum: [1, 2],
                  description: "1: Add, 2: Reduce",
                },
              },
              required: ["symbol", "amount", "type"],
            },
          },
          {
            name: "getPositionMarginHistory",
            description: "Get position margin change history.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                type: { type: "number", enum: [1, 2] },
                startTime: { type: "number" },
                endTime: { type: "number" },
                limit: { type: "number" },
              },
              required: ["symbol"],
            },
          },
          {
            name: "getPositionInfo",
            description: "Get current position information.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
              },
            },
          },
          {
            name: "getTradeList",
            description: "Get trades for a specific account and symbol.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                startTime: { type: "number" },
                endTime: { type: "number" },
                fromId: { type: "number" },
                limit: { type: "number" },
              },
              required: ["symbol"],
            },
          },
          {
            name: "getIncomeHistory",
            description: "Get income history.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                incomeType: { type: "string" },
                startTime: { type: "number" },
                endTime: { type: "number" },
                limit: { type: "number" },
              },
            },
          },
          {
            name: "getLeverageBrackets",
            description: "Get notional and leverage brackets.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
              },
            },
          },
          {
            name: "getAdlQuantile",
            description: "Get Position ADL Quantile Estimation.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
              },
            },
          },
          {
            name: "getForceOrders",
            description: "Get user's force orders.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                autoCloseType: { type: "string", enum: ["LIQUIDATION", "ADL"] },
                startTime: { type: "number" },
                endTime: { type: "number" },
                limit: { type: "number" },
              },
            },
          },
          {
            name: "getCommissionRate",
            description: "Get user's commission rate.",
            inputSchema: {
              type: "object",
              properties: {
                symbol: { type: "string" },
              },
              required: ["symbol"],
            },
          },
        ],
      };
    });

    // Handler for calling a tool. It now accepts auth credentials.
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request, extra) => {
        // Extract API credentials from the Authorization header.
        // Expected format: "apikey:apisecret"

        let apiKey: string | undefined;
        let apiSecret: string | undefined;
        // @ts-ignore
        const authHeader: string = extra.requestInfo?.headers?.authorization;
        if (authHeader) {
          try {
            const parts = authHeader.split(":");
            if (parts.length === 2) {
              // Attach credentials to the request object to be accessed in the handler
              apiKey = parts[0];
              apiSecret = parts[1];
            }
          } catch (e) {
            console.error("Invalid auth header", e);
          }
        }

        if (!apiKey || !apiSecret) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            "Missing or invalid Authorization header. Expected format: 'apikey:apisecret'"
          );
        }

        const { name, arguments: args } = request.params;

        // A helper function to make requests to the Aster API.
        const makeRequest = async (
          method: "GET" | "POST" | "DELETE",
          path: string,
          params: any,
          isSigned = false
        ) => {
          try {
            let config: any = {
              method,
              url: path,
            };

            if (isSigned) {
              if (!apiKey || !apiSecret) {
                throw new McpError(
                  ErrorCode.InvalidRequest,
                  "API Key and Secret are required for this endpoint."
                );
              }
              params.timestamp = Date.now();
              const queryString = new URLSearchParams(params).toString();
              const signature = crypto
                .createHmac("sha256", apiSecret)
                .update(queryString)
                .digest("hex");
              params.signature = signature;

              config.headers = { "X-MBX-APIKEY": apiKey };
            }

            if (method === "GET" || method === "DELETE") {
              config.params = params;
            } else {
              // POST
              config.data = new URLSearchParams(params).toString();
              config.headers = {
                ...config.headers,
                "Content-Type": "application/x-www-form-urlencoded",
              };
            }

            const response = await this.axiosInstance.request(config);
            return {
              content: [
                { type: "text", text: JSON.stringify(response.data, null, 2) },
              ],
            };
          } catch (error) {
            if (axios.isAxiosError(error)) {
              throw new McpError(
                ErrorCode.InternalError,
                `Aster API error: ${error.response?.data?.msg || error.message}`
              );
            }
            throw error;
          }
        };

        // Route the tool call to the appropriate API endpoint.
        switch (name) {
          // Market Data Endpoints
          case "ping":
            return makeRequest("GET", "/fapi/v1/ping", {});
          case "time":
            return makeRequest("GET", "/fapi/v1/time", {});
          case "exchangeInfo":
            return makeRequest("GET", "/fapi/v1/exchangeInfo", {});
          case "depth":
            return makeRequest("GET", "/fapi/v1/depth", args);
          case "trades":
            return makeRequest("GET", "/fapi/v1/trades", args);
          case "historicalTrades":
            return makeRequest("GET", "/fapi/v1/historicalTrades", args);
          case "aggTrades":
            return makeRequest("GET", "/fapi/v1/aggTrades", args);
          case "klines":
            return makeRequest("GET", "/fapi/v1/klines", args);
          case "indexPriceKlines":
            return makeRequest("GET", "/fapi/v1/indexPriceKlines", args);
          case "markPriceKlines":
            return makeRequest("GET", "/fapi/v1/markPriceKlines", args);
          case "premiumIndex":
            return makeRequest("GET", "/fapi/v1/premiumIndex", args);
          case "fundingRate":
            return makeRequest("GET", "/fapi/v1/fundingRate", args);
          case "fundingInfo":
            return makeRequest("GET", "/fapi/v1/fundingInfo", args);
          case "ticker_24hr":
            return makeRequest("GET", "/fapi/v1/ticker/24hr", args);
          case "ticker_price":
            return makeRequest("GET", "/fapi/v1/ticker/price", args);
          case "ticker_bookTicker":
            return makeRequest("GET", "/fapi/v1/ticker/bookTicker", args);

          // Account/Trades Endpoints (requires signing)
          case "setPositionMode":
            return makeRequest(
              "POST",
              "/fapi/v1/positionSide/dual",
              args,
              true
            );
          case "getPositionMode":
            return makeRequest("GET", "/fapi/v1/positionSide/dual", args, true);
          case "setMultiAssetsMode":
            return makeRequest(
              "POST",
              "/fapi/v1/multiAssetsMargin",
              args,
              true
            );
          case "getMultiAssetsMode":
            return makeRequest("GET", "/fapi/v1/multiAssetsMargin", args, true);
          case "placeOrder":
            return makeRequest("POST", "/fapi/v1/order", args, true);
          case "placeBatchOrders":
            if (!args || !args.batchOrders) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "batchOrders is required."
              );
            }
            const batchOrdersStr = JSON.stringify(args.batchOrders);
            return makeRequest(
              "POST",
              "/fapi/v1/batchOrders",
              { ...args, batchOrders: batchOrdersStr },
              true
            );
          case "transferAsset":
            return makeRequest(
              "POST",
              "/fapi/v1/asset/wallet/transfer",
              args,
              true
            );
          case "queryOrder":
            return makeRequest("GET", "/fapi/v1/order", args, true);
          case "cancelOrder":
            return makeRequest("DELETE", "/fapi/v1/order", args, true);
          case "cancelAllOpenOrders":
            return makeRequest("DELETE", "/fapi/v1/allOpenOrders", args, true);
          case "cancelBatchOrders":
            if (!args || (!args.orderIdList && !args.origClientOrderIdList)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                "Either orderIdList or origClientOrderIdList is required."
              );
            }
            const params = { ...args };
            if (params.orderIdList) {
              params.orderIdList = JSON.stringify(params.orderIdList);
            }
            if (params.origClientOrderIdList) {
              params.origClientOrderIdList = JSON.stringify(
                params.origClientOrderIdList
              );
            }
            return makeRequest("DELETE", "/fapi/v1/batchOrders", params, true);
          case "countdownCancelAll":
            return makeRequest(
              "POST",
              "/fapi/v1/countdownCancelAll",
              args,
              true
            );
          case "queryOpenOrder":
            return makeRequest("GET", "/fapi/v1/openOrder", args, true);
          case "getAllOpenOrders":
            return makeRequest("GET", "/fapi/v1/openOrders", args, true);
          case "getAllOrders":
            return makeRequest("GET", "/fapi/v1/allOrders", args, true);
          case "getBalance":
            return makeRequest("GET", "/fapi/v2/balance", args, true);
          case "getAccountInfo":
            return makeRequest("GET", "/fapi/v4/account", args, true);
          case "setLeverage":
            return makeRequest("POST", "/fapi/v1/leverage", args, true);
          case "setMarginType":
            return makeRequest("POST", "/fapi/v1/marginType", args, true);
          case "modifyPositionMargin":
            return makeRequest("POST", "/fapi/v1/positionMargin", args, true);
          case "getPositionMarginHistory":
            return makeRequest(
              "GET",
              "/fapi/v1/positionMargin/history",
              args,
              true
            );
          case "getPositionInfo":
            return makeRequest("GET", "/fapi/v2/positionRisk", args, true);
          case "getTradeList":
            return makeRequest("GET", "/fapi/v1/userTrades", args, true);
          case "getIncomeHistory":
            return makeRequest("GET", "/fapi/v1/income", args, true);
          case "getLeverageBrackets":
            return makeRequest("GET", "/fapi/v1/leverageBracket", args, true);
          case "getAdlQuantile":
            return makeRequest("GET", "/fapi/v1/adlQuantile", args, true);
          case "getForceOrders":
            return makeRequest("GET", "/fapi/v1/forceOrders", args, true);
          case "getCommissionRate":
            return makeRequest("GET", "/fapi/v1/commissionRate", args, true);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      }
    );
  }

  // Public method to access the underlying MCP server instance.
  public getServer(): Server {
    return this.server;
  }
}

// --- Main Application Setup ---

// Create a single instance of the AsterServer.
const asterServer = new AsterServer();
const mcpServer = asterServer.getServer();

// Create an Express application.
const app = express();
app.use(express.json());

// Define the /mcp endpoint for handling MCP requests.
app.post("/mcp", async (req, res) => {
  try {
    // Create a new transport for each request to ensure statelessness.
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    // Clean up the transport when the client connection closes.
    res.on("close", () => {
      transport.close();
    });

    // Connect the server to the transport and handle the request.
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// Start the Express server.
const port = parseInt(process.env.PORT || "3002");
app
  .listen(port, () => {
    console.log(`MCP Server running on http://localhost:${port}/mcp`);
  })
  .on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
