package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.exceptions.StockNotFoundException;
import com.stockChecker.live_stock_checker.model.Company;
import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.payload.StockPayload.*;
import com.stockChecker.live_stock_checker.repository.CompanyRepository;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.List;


@Service
public class StockServiceImpl implements StockService {

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private WebClient webClient;

    @Autowired
    private ObjectMapper objectMapper;


    /*
        entire flow, first checking if the stock exits in database,
        if not then we call to save into the Database, and then it returns that stock back.
    */

    @Override
    public StockDetailResponseDTO getStockBySymbol(String symbol) throws JsonProcessingException {
        /*
            checking if the stock is valid or not as both invalid and valid response's have 200 status code.
            Now,to fix this we would manually check if error field exists->throw Exception

            Otherwise,if the "error" field doesn't exist then it's a valid symbol, and we got a valid
            realTime stock response.
         */

        String jsonResponseString = webClient.get()
                .uri("/quote-equity?symbol=" + symbol.toUpperCase())
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode rootNode = objectMapper.readTree(jsonResponseString);

        if (rootNode.has("error") || rootNode.has("message")) {
            throw new StockNotFoundException("This stock doesnt exists with symbol: " + symbol);
        }

        /*
            Understanding Mono<T> in SpringBoot

            So whenever you use a webClient, the output of it is always Mono,which can have different values like
            Mono<String> or Mono<ResponseEntity<String>> so on.

            understand mono to be a container, since webclient is reactive in nature, allowing non-blocking asynchronous
            calling/execution of requests so the value is empty first which is mono but later on when the response is
            received, it has to be assigned somewhere again so it get's filled in that mono container which was assigned
            to our variable.

            Initially, Mono is assigned until the response is received back and as we get so it gets filled by the response
            basically a container holding/reserving a place for the response to be kept in later when its received.
        */

        JsonNode infoNode = rootNode.get("info");
        JsonNode priceInfoNode = rootNode.get("priceInfo");

        Stock stockFound = stockRepository.findByStockSymbol(symbol.toUpperCase())
                .orElseGet(() -> saveStockInDB(symbol, rootNode, infoNode));
        // Lazy Initialization - object creation delayed until first access

        StockDetailResponseDTO stockFoundDTO = modelMapper.map(stockFound, StockDetailResponseDTO.class);
        // companyDTO remains empty so need to fix and fill that.
        if (stockFound.getCompany() != null) {
            CompanyResponseDTO companyResponseDTO = modelMapper.map(stockFound.getCompany(), CompanyResponseDTO.class);
            stockFoundDTO.setCompanyResponseDTO(companyResponseDTO);
        }
        // creating a StockPriceInfoDTO
        StockPriceInfoDTO stockPriceInfoDTO = new StockPriceInfoDTO();
        stockPriceInfoDTO.setLastPrice(new BigDecimal(priceInfoNode.get("lastPrice").asText()));
        stockPriceInfoDTO.setChange(new BigDecimal(priceInfoNode.get("change").asText()));
        stockPriceInfoDTO.setPChange(new BigDecimal(priceInfoNode.get("pChange").asText()));
        stockPriceInfoDTO.setPreviousClose(new BigDecimal(priceInfoNode.get("previousClose").asText()));
        stockPriceInfoDTO.setOpen(new BigDecimal(priceInfoNode.get("open").asText()));
        stockPriceInfoDTO.setClose(new BigDecimal(priceInfoNode.get("close").asText()));
        // setting the high-low of the day
        stockPriceInfoDTO.setDayHigh(new BigDecimal(priceInfoNode.get("intraDayHighLow").get("max").asText()));
        stockPriceInfoDTO.setDayLow(new BigDecimal(priceInfoNode.get("intraDayHighLow").get("min").asText()));

        // setting the high-low of the week
        stockPriceInfoDTO.setWeekLow(new BigDecimal(priceInfoNode.get("weekHighLow").get("min").asText()));
        stockPriceInfoDTO.setWeekLowDate(priceInfoNode.get("weekHighLow").get("minDate").asText());
        stockPriceInfoDTO.setWeekHigh(new BigDecimal(priceInfoNode.get("weekHighLow").get("max").asText()));
        stockPriceInfoDTO.setWeekHighDate(priceInfoNode.get("weekHighLow").get("maxDate").asText());

        // setting the lowerCircuitPrice and upperCircuitPrice
        stockPriceInfoDTO.setLowerCP(new BigDecimal(priceInfoNode.get("lowerCP").asText()));
        stockPriceInfoDTO.setUpperCP(new BigDecimal(priceInfoNode.get("upperCP").asText()));
        stockPriceInfoDTO.setBasePrice(new BigDecimal(priceInfoNode.get("basePrice").asText()));

        stockFoundDTO.setStockPriceInfoDTO(stockPriceInfoDTO);
//      Combined stored metadata with real-time price data and returning complete StockFoundDTO
        return stockFoundDTO;
    }

    // private method which is being used in implementation and not allowed outside
    private Stock saveStockInDB(String symbol, JsonNode rootNode, JsonNode infoNode) {

        Stock newStock = Stock.builder()
                .stockName(infoNode.get("companyName").asText().toUpperCase())
                .stockWebsite(null)
                .listedExchangeName("NSE")
                .stockSymbol(infoNode.get("symbol").asText())
                .build();
        // as stock gets created we continue the creation of its company alongside as they are OneToOne mapped
        Company newCompany = Company.builder()
                .companyName(infoNode.get("companyName").asText())
                .aboutCompany("this company works is " + infoNode.get("companyName").asText())// update with yahoo api
                .sector(rootNode.get("industryInfo").get("sector").asText())
                .subIndustry(infoNode.get("industry").asText())
                .industry(rootNode.get("industryInfo").get("industry").asText())
                .listingDate(rootNode.get("metadata").get("listingDate").asText())
                .isIN(rootNode.get("metadata").get("isin").asText())
                .stock(newStock)
                .build();
        companyRepository.save(newCompany);
        newStock.setCompany(newCompany);
        // we don't need to save as we have cascadeType.ALL so when stock is saved, equivalent company is also saved.
        return stockRepository.save(newStock);
    }

    @Override
    public StockResponse searchStockByName(String query, Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {
        // spring data jpa translate's Containing to LIKE %VALUE%
        Sort sortAndOrder = sortOrder.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(pageNumber, pageSize, sortAndOrder);

        Page<Stock> stockList = stockRepository.findByStockNameContainingIgnoreCaseOrStockSymbolContainingIgnoreCase(query, query, pageable);

        List<StockSearchResponseDTO> stockSearchResponseDTOList = stockList.getContent()
                .stream()
                .map((eachStock) ->
                        modelMapper.map(eachStock, StockSearchResponseDTO.class))
                .toList();

        StockResponse stockResponse = new StockResponse();
        stockResponse.setContent(stockSearchResponseDTOList);
        stockResponse.setPageNumber(stockList.getNumber());
        stockResponse.setPageSize(stockList.getSize());
        stockResponse.setTotalPages(stockList.getTotalPages());
        stockResponse.setTotalElements(stockList.getTotalElements());
        stockResponse.setLast(stockList.isLast());
        stockResponse.setFirst(stockList.isFirst());
        return stockResponse;
    }
}
