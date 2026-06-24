complete frontend fix

deployed domanin: https://stoxy-finance.onrender.com/api/v2/

swagger deployed link: https://stoxy-finance.onrender.com/api/v2/swagger-ui/index.html

watchlist-controller

POST
/watchlist/{watchlistId}/stocks

Parameters
Try it out
Name	Description
watchlistId *
integer($int64)
(path)
watchlistId
Request body

application/json
Example Value
Schema
{
  "stockSymbol": "string",
  "instrumentKey": "string",
  "isin": "string",
  "priceAddedAt": 0
}
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "stockName": "string",
  "stockSymbol": "string",
  "instrumentKey": "string",
  "priceAddedAt": 0,
  "addedAt": "2026-06-23T16:24:14.163Z"
}
No links

DELETE
/watchlist/{watchlistId}/stocks

Parameters
Try it out
Name	Description
watchlistId *
integer($int64)
(path)
watchlistId
stockInstrumentKey *
string
(query)
stockInstrumentKey
Responses
Code	Description	Links
200
OK

No links

POST
/watchlist/create

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "watchlistName": "string"
}
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "watchlistName": "string",
  "watchlistStocks": [
    {
      "stockName": "string",
      "stockSymbol": "string",
      "instrumentKey": "string",
      "priceAddedAt": 0,
      "addedAt": "2026-06-23T16:24:14.164Z"
    }
  ],
  "createdAt": "2026-06-23T16:24:14.164Z"
}
No links

GET
/watchlist/{watchlistId}

Parameters
Try it out
Name	Description
watchlistId *
integer($int64)
(path)
watchlistId
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "watchlistName": "string",
  "watchlistStocks": [
    {
      "stockName": "string",
      "stockSymbol": "string",
      "instrumentKey": "string",
      "priceAddedAt": 0,
      "addedAt": "2026-06-23T16:24:14.165Z"
    }
  ],
  "createdAt": "2026-06-23T16:24:14.165Z"
}
No links

DELETE
/watchlist/{watchlistId}

Parameters
Try it out
Name	Description
watchlistId *
integer($int64)
(path)
watchlistId
Responses
Code	Description	Links
200
OK

No links

GET
/watchlist/

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
[
  {
    "watchlistId": 0,
    "watchlistName": "string",
    "createdAt": "2026-06-23T16:24:14.167Z"
  }
]
No links
stock-controller

POST
/stocks/details

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "stockName": "string",
  "stockSymbol": "string",
  "companyName": "string",
  "exchange": "string",
  "instrumentKey": "string",
  "isin": "string"
}
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "stockName": "string",
  "stockSymbol": "string",
  "exchange": "string",
  "isin": "string",
  "instrumentKey": "string",
  "stockFinancialsDTO": {
    "pe": 0.1,
    "sectorPe": 0.1,
    "pb": 0.1,
    "sectorPb": 0.1,
    "roa": 0.1,
    "sectorRoa": 0.1,
    "roe": 0.1,
    "sectorRoe": 0.1
  },
  "companyResponseDTO": {
    "companyName": "string",
    "description": "string",
    "sector": "string",
    "sectorMarketCap": "string"
  }
}
No links

GET
/stocks/search

Parameters
Try it out
Name	Description
query *
string
(query)
query
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "content": [
    {
      "stockName": "string",
      "stockSymbol": "string",
      "companyName": "string",
      "exchange": "string",
      "instrumentKey": "string",
      "isin": "string"
    }
  ]
}
No links

GET
/stocks/search/screen

Parameters
Try it out
Name	Description
minPe
number($double)
(query)
minPe
maxPe
number($double)
(query)
maxPe
sector
string
(query)
sector
industry
string
(query)
industry
pageNumber
integer($int32)
(query)
Default value : 0

0
pageSize
integer($int32)
(query)
Default value : 15

15
sortBy
string
(query)
Default value : stockName

stockName
sortOrder
string
(query)
Default value : asc

asc
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "content": [
    {
      "stockName": "string",
      "stockSymbol": "string",
      "companyResponseDTO": {
        "companyName": "string",
        "description": "string",
        "sector": "string",
        "sectorMarketCap": "string"
      },
      "stockFinancialsDTO": {
        "pe": 0.1,
        "sectorPe": 0.1,
        "pb": 0.1,
        "sectorPb": 0.1,
        "roa": 0.1,
        "sectorRoa": 0.1,
        "roe": 0.1,
        "sectorRoe": 0.1
      }
    }
  ],
  "pageNumber": 0,
  "pageSize": 0,
  "totalElements": 0,
  "totalPages": 0,
  "last": true,
  "first": true
}
No links
portfolio-controller

POST
/portfolio/sellStock

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "stockSymbol": "string",
  "quantity": 1,
  "instrumentKey": "string",
  "sellingPrice": 0
}
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "stockSymbol": "string",
  "instrumentKey": "string",
  "sellPrice": 0,
  "quantitySold": 0,
  "realizedProfitLoss": 0,
  "soldAt": "2026-06-23T16:24:14.174Z"
}
No links

POST
/portfolio/buyStock

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "stockSymbol": "string",
  "quantity": 1,
  "buyPrice": 0,
  "instrumentKey": "string",
  "isin": "string"
}
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "stockSymbol": "string",
  "instrumentKey": "string",
  "buyPrice": 0,
  "quantityBought": 0,
  "boughtAt": "2026-06-23T16:24:14.175Z"
}
No links

GET
/portfolio/transactions

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
[
  {
    "portfolioId": 0,
    "stockSymbol": "string",
    "quantity": 0,
    "price": 0,
    "type": "string",
    "transactionAt": "2026-06-23T16:24:14.175Z"
  }
]
No links

GET
/portfolio/transactions/export

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
string
No links

GET
/portfolio/transaction/{stockSymbol}

Parameters
Try it out
Name	Description
stockSymbol *
string
(path)
stockSymbol
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
[
  {
    "portfolioId": 0,
    "stockSymbol": "string",
    "quantity": 0,
    "price": 0,
    "type": "string",
    "transactionAt": "2026-06-23T16:24:14.177Z"
  }
]
No links

GET
/portfolio/

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "portfolioId": 0,
  "lastUpdatedAt": "2026-06-23T16:24:14.178Z",
  "totalInvestedValue": 0,
  "totalCurrentValue": 0,
  "totalUnrealizedPnL": 0,
  "totalUnrealizedPnLPercent": 0,
  "totalDayPnL": 0,
  "totalDayPnLPercent": 0,
  "stocks": [
    {
      "stockName": "string",
      "stockSymbol": "string",
      "avgBuyingPrice": 0,
      "totalQuantity": 0,
      "investedAmount": 0,
      "instrumentKey": "string",
      "currentValue": 0,
      "ltp": 0,
      "unrealizedPnL": 0,
      "unrealizedPnLPercent": 0,
      "dayPnL": 0,
      "dayPnLPercent": 0
    }
  ],
  "sectorBreakdown": {
    "additionalProp1": 0,
    "additionalProp2": 0,
    "additionalProp3": 0
  }
}
No links
ticker-controller

GET
/ticker/live/ltpc

Parameters
Try it out
Name	Description
instrumentKeyList *
array<string>
(query)
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "additionalProp1": {
    "instrumentKey": "string",
    "ltp": 0,
    "ltt": 0,
    "cp": 0
  },
  "additionalProp2": {
    "instrumentKey": "string",
    "ltp": 0,
    "ltt": 0,
    "cp": 0
  },
  "additionalProp3": {
    "instrumentKey": "string",
    "ltp": 0,
    "ltt": 0,
    "cp": 0
  }
}
No links

GET
/ticker/live/fullFeed

Parameters
Try it out
Name	Description
instrumentKeyList *
array<string>
(query)
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "additionalProp1": {
    "instrumentKey": "string",
    "ltp": 0,
    "ltt": 0,
    "cp": 0,
    "marketLevel": [
      {
        "bidQ": 0,
        "bidP": 0,
        "askQ": 0,
        "askP": 0
      }
    ],
    "atp": 0,
    "vtt": 0,
    "oi": 0,
    "iv": 0,
    "tbq": 0,
    "tsq": 0,
    "upper_circuit": 0.1,
    "lower_circuit": 0.1
  },
  "additionalProp2": {
    "instrumentKey": "string",
    "ltp": 0,
    "ltt": 0,
    "cp": 0,
    "marketLevel": [
      {
        "bidQ": 0,
        "bidP": 0,
        "askQ": 0,
        "askP": 0
      }
    ],
    "atp": 0,
    "vtt": 0,
    "oi": 0,
    "iv": 0,
    "tbq": 0,
    "tsq": 0,
    "upper_circuit": 0.1,
    "lower_circuit": 0.1
  },
  "additionalProp3": {
    "instrumentKey": "string",
    "ltp": 0,
    "ltt": 0,
    "cp": 0,
    "marketLevel": [
      {
        "bidQ": 0,
        "bidP": 0,
        "askQ": 0,
        "askP": 0
      }
    ],
    "atp": 0,
    "vtt": 0,
    "oi": 0,
    "iv": 0,
    "tbq": 0,
    "tsq": 0,
    "upper_circuit": 0.1,
    "lower_circuit": 0.1
  }
}
No links
index-controller

GET
/index/search

Parameters
Try it out
Name	Description
query *
string
(query)
query
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "indexSearchDTOList": [
    {
      "indexName": "string",
      "indexSymbol": "string",
      "exchange": "string",
      "segment": "string",
      "instrumentKey": "string"
    }
  ]
}
No links

GET
/index/search/{instrumentKey}

Parameters
Try it out
Name	Description
instrumentKey *
string
(path)
instrumentKey
Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "indexName": "string",
  "indexSymbol": "string",
  "instrumentKey": "string",
  "indexMetadataDTO": {
    "indexPriority": 0,
    "numberOfConstituents": 0,
    "launchDate": "string",
    "baseDate": "string",
    "methodology": "string",
    "description": "string",
    "isActive": true
  },
  "indexAdvanceDTO": {
    "declines": 0,
    "advances": 0,
    "unChanged": 0
  },
  "indexPriceInfoDTO": {
    "ffmc": 0,
    "indexSymbol": "string",
    "open": 0,
    "lastPrice": 0,
    "previousClose": 0,
    "totalTradedVolume": 0,
    "totalTradedValue": 0,
    "dayHigh": 0,
    "dayLow": 0,
    "change": 0,
    "yearHigh": 0,
    "yearLow": 0,
    "nearWKH": 0,
    "nearWKL": 0,
    "pchange": 0
  }
}
No links
auth-controller

GET
/auth/userInfo

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "userName": "string",
  "userEmailId": "string",
  "jwtToken": "string",
  "providerType": "string"
}
No links

GET
/auth/logout

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
string
No links

Schemas
WatchlistStockRequestDTOCollapse allobject
stockSymbolstring≥ 1 characters
instrumentKeystring≥ 1 characters
isinstring
priceAddedAtnumber
WatchlistStockResponseDTOCollapse allobject
stockNamestring
stockSymbolstring
instrumentKeystring
priceAddedAtnumber
addedAtstringdate-time
CreateWatchRequestDTOCollapse allobject
watchlistNamestring
WatchlistResponseDTOCollapse allobject
watchlistNamestring
watchlistStocksCollapse allarray<object>
ItemsCollapse allobject
stockNamestring
stockSymbolstring
instrumentKeystring
priceAddedAtnumber
addedAtstringdate-time
createdAtstringdate-time
StockSearchDTOCollapse allobject
stockNamestring
stockSymbolstring
companyNamestring
exchangestring
instrumentKeystring
isinstring
CompanyResponseDTOCollapse allobject
companyNamestring
descriptionstring
sectorstring
sectorMarketCapstring
StockDetailResponseDTOCollapse allobject
stockNamestring
stockSymbolstring
exchangestring
isinstring
instrumentKeystring
stockFinancialsDTOCollapse allobject
penumberdouble
sectorPenumberdouble
pbnumberdouble
sectorPbnumberdouble
roanumberdouble
sectorRoanumberdouble
roenumberdouble
sectorRoenumberdouble
companyResponseDTOCollapse allobject
companyNamestring
descriptionstring
sectorstring
sectorMarketCapstring
StockFinancialsDTOCollapse allobject
penumberdouble
sectorPenumberdouble
pbnumberdouble
sectorPbnumberdouble
roanumberdouble
sectorRoanumberdouble
roenumberdouble
sectorRoenumberdouble
SellStockRequestDTOCollapse allobject
stockSymbolstring≥ 1 characters
quantityinteger≥ 1int32
instrumentKeystring
sellingPricenumber
SellStockResponseDTOCollapse allobject
stockSymbolstring
instrumentKeystring
sellPricenumber
quantitySoldintegerint32
realizedProfitLossnumber
soldAtstringdate-time
BuyStockRequestDTOCollapse allobject
stockSymbolstring≥ 1 characters
quantityinteger≥ 1int32
buyPricenumber
instrumentKeystring
isinstring
BuyStockResponseDTOCollapse allobject
stockSymbolstring
instrumentKeystring
buyPricenumber
quantityBoughtintegerint32
boughtAtstringdate-time
WatchlistSummaryDTOCollapse allobject
watchlistIdintegerint64
watchlistNamestring
createdAtstringdate-time
LtpcDataDTOCollapse allobject
instrumentKeystring
ltpnumber
lttintegerint64
cpnumber
FullFeedDataDTOCollapse allobject
instrumentKeystring
ltpnumber
lttintegerint64
cpnumber
marketLevelCollapse allarray<object>
ItemsCollapse allobject
bidQintegerint64
bidPnumber
askQintegerint64
askPnumber
atpnumber
vttintegerint64
oinumber
ivnumber
tbqintegerint64
tsqintegerint64
upper_circuitnumberdouble
lower_circuitnumberdouble
QuoteDTOCollapse allobject
bidQintegerint64
bidPnumber
askQintegerint64
askPnumber
StockSearchResponseDTOCollapse allobject
contentCollapse allarray<object>
ItemsCollapse allobject
stockNamestring
stockSymbolstring
companyNamestring
exchangestring
instrumentKeystring
isinstring
StockScreenerDTOCollapse allobject
contentCollapse allarray<object>
ItemsCollapse allobject
stockNamestring
stockSymbolstring
companyResponseDTOCollapse allobject
companyNamestring
descriptionstring
sectorstring
sectorMarketCapstring
stockFinancialsDTOCollapse allobject
penumberdouble
sectorPenumberdouble
pbnumberdouble
sectorPbnumberdouble
roanumberdouble
sectorRoanumberdouble
roenumberdouble
sectorRoenumberdouble
pageNumberintegerint32
pageSizeintegerint32
totalElementsintegerint64
totalPagesintegerint32
lastboolean
firstboolean
StockScreenerResponseDTOCollapse allobject
stockNamestring
stockSymbolstring
companyResponseDTOCollapse allobject
companyNamestring
descriptionstring
sectorstring
sectorMarketCapstring
stockFinancialsDTOCollapse allobject
penumberdouble
sectorPenumberdouble
pbnumberdouble
sectorPbnumberdouble
roanumberdouble
sectorRoanumberdouble
roenumberdouble
sectorRoenumberdouble
TransactionResponseDTOCollapse allobject
portfolioIdintegerint64
stockSymbolstring
quantityintegerint32
pricenumber
typestring
transactionAtstringdate-time
PortfolioResponseDTOCollapse allobject
portfolioIdintegerint64
lastUpdatedAtstringdate-time
totalInvestedValuenumber
totalCurrentValuenumber
totalUnrealizedPnLnumber
totalUnrealizedPnLPercentnumber
totalDayPnLnumber
totalDayPnLPercentnumber
stocksCollapse allarray<object>
ItemsCollapse allobject
stockNamestring
stockSymbolstring
avgBuyingPricenumber
totalQuantityintegerint32
investedAmountnumber
instrumentKeystring
currentValuenumber
ltpnumber
unrealizedPnLnumber
unrealizedPnLPercentnumber
dayPnLnumber
dayPnLPercentnumber
sectorBreakdownCollapse allobject
Additional propertiesnumber
PortfolioStockResponseDTOCollapse allobject
stockNamestring
stockSymbolstring
avgBuyingPricenumber
totalQuantityintegerint32
investedAmountnumber
instrumentKeystring
currentValuenumber
ltpnumber
unrealizedPnLnumber
unrealizedPnLPercentnumber
dayPnLnumber
dayPnLPercentnumber
IndexSearchDTOCollapse allobject
indexNamestring
indexSymbolstring
exchangestring
segmentstring
instrumentKeystring
IndexSearchResponseDTOCollapse allobject
indexSearchDTOListCollapse allarray<object>
ItemsCollapse allobject
indexNamestring
indexSymbolstring
exchangestring
segmentstring
instrumentKeystring
IndexAdvanceDTOCollapse allobject
declinesintegerint32
advancesintegerint32
unChangedintegerint32
IndexDetailResponseDTOCollapse allobject
indexNamestring
indexSymbolstring
instrumentKeystring
indexMetadataDTOCollapse allobject
indexPriorityintegerint32
numberOfConstituentsintegerint32
launchDatestring
baseDatestring
methodologystring
descriptionstring
isActiveboolean
indexAdvanceDTOCollapse allobject
declinesintegerint32
advancesintegerint32
unChangedintegerint32
indexPriceInfoDTOCollapse allobject
ffmcnumber
indexSymbolstring
opennumber
lastPricenumber
previousClosenumber
totalTradedVolumenumber
totalTradedValuenumber
dayHighnumber
dayLownumber
changenumber
yearHighnumber
yearLownumber
nearWKHnumber
nearWKLnumber
pchangenumber
IndexMetadataDTOCollapse allobject
indexPriorityintegerint32
numberOfConstituentsintegerint32
launchDatestring
baseDatestring
methodologystring
descriptionstring
isActiveboolean
IndexPriceInfoDTOCollapse allobject
ffmcnumber
indexSymbolstring
opennumber
lastPricenumber
previousClosenumber
totalTradedVolumenumber
totalTradedValuenumber
dayHighnumber
dayLownumber
changenumber
yearHighnumber
yearLownumber
nearWKHnumber
nearWKLnumber
pchangenumber
UserInfoResponseDTOCollapse allobject
userNamestring
userEmailIdstring
jwtTokenstring
providerTypestring

