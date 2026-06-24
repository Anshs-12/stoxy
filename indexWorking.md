ticker-controller


GET
/ticker/live/ltpc

Parameters
Cancel
Name	Description
instrumentKeyList *
array<string>
(query)
NSE_INDEX|Nifty 50
-
Add string item
Execute
Clear
Responses
Curl

curl -X 'GET' \
'https://stoxy-finance.onrender.com/api/v2/ticker/live/ltpc?instrumentKeyList=NSE_INDEX%7CNifty%2050' \
-H 'accept: */*'
Request URL
https://stoxy-finance.onrender.com/api/v2/ticker/live/ltpc?instrumentKeyList=NSE_INDEX%7CNifty%2050
Server response
Code	Details
200
Response body
Download
{
"NSE_INDEX|Nifty 50": {
"instrumentKey": "NSE_INDEX|Nifty 50",
"ltp": 23824.1,
"ltt": 1782210600000,
"cp": 23824.1
}
}
Response headers
alt-svc: h3=":443"; ma=86400
cache-control: no-cache,no-store,max-age=0,must-revalidate
cf-cache-status: DYNAMIC
cf-ray: a1058b69eabd7f88-MAA
content-encoding: br
content-length: 83
content-type: application/json
date: Tue,23 Jun 2026 18:27:03 GMT
expires: 0
pragma: no-cache
priority: u=1,i
rndr-id: a118dfda-5f06-4ae5
server: cloudflare
server-timing: cfExtPri
strict-transport-security: max-age=31536000 ; includeSubDomains
vary: Accept-Encoding
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
x-render-origin-server: Render
x-xss-protection: 0
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
Cancel
Name	Description
instrumentKeyList *
array<string>
(query)
NSE_INDEX|Nifty 50
-
Add string item
Execute
Clear
Responses
Curl

curl -X 'GET' \
'https://stoxy-finance.onrender.com/api/v2/ticker/live/fullFeed?instrumentKeyList=NSE_INDEX%7CNifty%2050' \
-H 'accept: */*'
Request URL
https://stoxy-finance.onrender.com/api/v2/ticker/live/fullFeed?instrumentKeyList=NSE_INDEX%7CNifty%2050
Server response
Code	Details
200
Response body
Download
{
"NSE_INDEX|Nifty 50": {
"instrumentKey": "NSE_INDEX|Nifty 50",
"ltp": 23824.1,
"ltt": 1782210600000,
"cp": 23824.1,
"marketLevel": [
{
"bidQ": 0,
"bidP": 0,
"askQ": 0,
"askP": 0
},
{
"bidQ": 0,
"bidP": 0,
"askQ": 0,
"askP": 0
},
{
"bidQ": 0,
"bidP": 0,
"askQ": 0,
"askP": 0
},
{
"bidQ": 0,
"bidP": 0,
"askQ": 0,
"askP": 0
},
{
"bidQ": 0,
"bidP": 0,
"askQ": 0,
"askP": 0
}
],
"atp": 0,
"vtt": 0,
"oi": null,
"iv": null,
"tbq": 0,
"tsq": 0,
"upper_circuit": 0,
"lower_circuit": 0
}
}
Response headers
alt-svc: h3=":443"; ma=86400
cache-control: no-cache,no-store,max-age=0,must-revalidate
cf-cache-status: DYNAMIC
cf-ray: a1058aceef907f88-MAA
content-encoding: br
content-length: 177
content-type: application/json
date: Tue,23 Jun 2026 18:26:39 GMT
expires: 0
pragma: no-cache
priority: u=1,i
rndr-id: 02f2df81-0d56-4b86
server: cloudflare
server-timing: cfExtPri
strict-transport-security: max-age=31536000 ; includeSubDomains
vary: Accept-Encoding
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
x-render-origin-server: Render
x-xss-protection: 0
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
NIFTY 50
Responses
Curl

curl -X 'GET' \
'https://stoxy-finance.onrender.com/api/v2/index/search?query=NIFTY%2050' \
-H 'accept: */*'
Request URL
https://stoxy-finance.onrender.com/api/v2/index/search?query=NIFTY%2050
Server response
Code	Details
200
Response body
Download
{
"indexSearchDTOList": [
{
"indexName": "NIFTY 50",
"indexSymbol": "NIFTY",
"exchange": "NSE",
"segment": "NSE_INDEX",
"instrumentKey": "NSE_INDEX|Nifty 50"
},
{
"indexName": "NIFTY 500",
"indexSymbol": "NIFTY 500",
"exchange": "NSE",
"segment": "NSE_INDEX",
"instrumentKey": "NSE_INDEX|Nifty 500"
}
]
}
Response headers
alt-svc: h3=":443"; ma=86400
cache-control: no-cache,no-store,max-age=0,must-revalidate
cf-cache-status: DYNAMIC
cf-ray: a105899b6d63ac6d-MAA
content-encoding: br
content-length: 129
content-type: application/json
date: Tue,23 Jun 2026 18:25:49 GMT
expires: 0
pragma: no-cache
priority: u=1,i
rndr-id: 35463ddb-1f72-494c
server: cloudflare
server-timing: cfExtPri
strict-transport-security: max-age=31536000 ; includeSubDomains
vary: Accept-Encoding
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
x-render-origin-server: Render
x-xss-protection: 0
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
NSE_INDEX|Nifty 50
Responses
Curl

curl -X 'GET' \
'https://stoxy-finance.onrender.com/api/v2/index/search/NSE_INDEX%7CNifty%2050' \
-H 'accept: */*'
Request URL
https://stoxy-finance.onrender.com/api/v2/index/search/NSE_INDEX%7CNifty%2050
Server response
Code	Details
200
Response body
Download
{
"indexName": "NIFTY 50",
"indexSymbol": "NIFTY",
"instrumentKey": "NSE_INDEX|Nifty 50",
"indexMetadataDTO": {
"indexPriority": 1,
"numberOfConstituents": 50,
"launchDate": "April 22, 1996",
"baseDate": "November 03, 1995",
"methodology": "Free Float Market Capitalization",
"description": "The NIFTY 50 is an Indian stock market index that represents the free-float market capitalization weighted average of 50 of the largest Indian companies listed on the National Stock Exchange (NSE).",
"isActive": true
},
"indexAdvanceDTO": null,
"indexPriceInfoDTO": null
}
Response headers
alt-svc: h3=":443"; ma=86400
cache-control: no-cache,no-store,max-age=0,must-revalidate
cf-cache-status: DYNAMIC
cf-ray: a1058a02beceac6d-MAA
content-encoding: br
content-length: 340
content-type: application/json
date: Tue,23 Jun 2026 18:26:06 GMT
expires: 0
pragma: no-cache
priority: u=1,i
rndr-id: 9e23796e-5369-4e5c
server: cloudflare
server-timing: cfExtPri
strict-transport-security: max-age=31536000 ; includeSubDomains
vary: Accept-Encoding
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
x-render-origin-server: Render
x-xss-protection: 0
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