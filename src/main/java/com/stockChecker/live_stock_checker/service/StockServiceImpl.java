package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.Specification.StockScreenerSpec;
import com.stockChecker.live_stock_checker.exceptions.UpstoxFeedException;
import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.payload.MarketStatusResponse;
import com.stockChecker.live_stock_checker.payload.StockPayload.*;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
@Slf4j
public class StockServiceImpl implements StockService {

    private final StockRepository stockRepository;

    private final ModelMapper modelMapper;

    private final ObjectMapper objectMapper;

    private final MarketStatusService marketStatusService;

    private final StockCacheService stockCacheService;

    private final RestClient restClient;

    /*
        entire flow, first checking if the stock exits in a database,
        if not, then we call to save into the Database, and then it returns that stock.
    */

    @Override
    public StockDetailResponseDTO getStockDetails(StockSearchDTO stockRequest) {
        MarketStatusResponse response = marketStatusService.isMarketOpen();
        if (response.getIsOpen()) {
            return stockCacheService.getStockLive(stockRequest);
        }
        if (response.getNextOpeningDay().equals("MONDAY")) {
            return stockCacheService.getStockWeekendClosed(stockRequest);
        }
        return stockCacheService.getStockWeekdayClosed(stockRequest);
    }

    @Override
    // this method needs no caching as it's used for search bar when a user tries to search a stock name.
    public StockSearchResponseDTO searchStockByName(String query) {
        // spring data jpa translates Containing to LIKE %VALUE%

        List<Stock> stockList = stockRepository.searchStocks(query);

        List<StockSearchDTO> stockSearchList = stockList
                .stream()
                .map((eachStock) ->
                        modelMapper.map(eachStock, StockSearchDTO.class))
                .toList();
        if (stockSearchList.isEmpty()) {
            // this indicates that database doesn't have any stock regarding the search, so expand to upstox search.
            stockSearchList = searchUpstoxEquity(query);
        }

        return StockSearchResponseDTO.builder()
                .content(stockSearchList)
                .build();
    }

    private List<StockSearchDTO> searchUpstoxEquity(String stockSymbol) {
        String upstoxJsonResponse = restClient.get()
                .uri("/v2/instruments/search?query={stockSymbol}", stockSymbol)
                .retrieve()
                .body(String.class);
        return parseUpstoxSearchResults(upstoxJsonResponse);
    }

    private List<StockSearchDTO> parseUpstoxSearchResults(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            if (!root.path("status").asText().equals("success")) {
                throw new UpstoxFeedException("Error in searching via endpoint");
            }
            List<StockSearchDTO> upstoxResponseList = new ArrayList<>();
            for (var eachStockNode : root.path("data")) {
                if (!eachStockNode.path("isin").asText().startsWith("INE")) continue;
                StockSearchDTO stockResponse = StockSearchDTO.builder()
                        .stockSymbol(eachStockNode.path("trading_symbol").asText())
                        .stockName(eachStockNode.path("short_name").asText())
                        .companyName(eachStockNode.path("name").asText())
                        .exchange(eachStockNode.path("exchange").asText())
                        .instrumentKey(eachStockNode.path("instrument_key").asText())
                        .isin(eachStockNode.path("isin").asText())
                        .build();
                upstoxResponseList.add(stockResponse);
            }
            return upstoxResponseList;
        } catch (JsonProcessingException e) {
            throw new UpstoxFeedException("Failed to parse Upstox search response");
        }
    }

    @Override
    public StockScreenerDTO searchScreenStocks(Double minPe, Double maxPe, String sector, String industry,
                                               Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {
        log.info("Screening stocks - minPe: {}, maxPe: {}, sector: {}, industry: {}, page: {}, size: {}", minPe, maxPe, sector, industry, pageNumber, pageSize);
        // initial spec that returns no predicate (match all)
        Specification<Stock> spec = (root, query, cb) -> null;
        if (minPe != null) {
            spec = spec.and(StockScreenerSpec.hasMinPe(minPe));
        }
        if (maxPe != null) {
            spec = spec.and(StockScreenerSpec.hasMaxPe(maxPe));
        }
        if (sector != null && !sector.isBlank()) {
            spec = spec.and(StockScreenerSpec.hasSector(sector));
        }
        if (industry != null && !industry.isBlank()) {
            spec = spec.and(StockScreenerSpec.hasIndustry(industry));
        }

        // build pageable + sorting
        Sort sortAndOrder = sortOrder.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sortAndOrder);

        Page<Stock> pageStockScreenerList = stockRepository.findAll(spec, pageable);
        List<StockScreenerResponseDTO> stockScreenerResponseDTOList =
                pageStockScreenerList.getContent()
                        .stream()
                        .map((eachStock) -> mapToScreenerDTO(eachStock))
                        .toList();
        log.info("Screening complete - totalResults: {}", pageStockScreenerList.getTotalElements());
        return mapPageDetails(stockScreenerResponseDTOList, pageStockScreenerList);
    }

    private StockScreenerDTO mapPageDetails(List<StockScreenerResponseDTO> stockScreenerResponseDTOList, Page<Stock> pageStockScreenerList) {
        StockScreenerDTO StockScreenerDTO = new StockScreenerDTO();
        StockScreenerDTO.setContent(stockScreenerResponseDTOList);
        StockScreenerDTO.setPageNumber(pageStockScreenerList.getNumber());
        StockScreenerDTO.setPageSize(pageStockScreenerList.getSize());
        StockScreenerDTO.setTotalPages(pageStockScreenerList.getTotalPages());
        StockScreenerDTO.setTotalElements(pageStockScreenerList.getTotalElements());
        StockScreenerDTO.setLast(pageStockScreenerList.isLast());
        StockScreenerDTO.setFirst(pageStockScreenerList.isFirst());
        return StockScreenerDTO;
    }

    private StockScreenerResponseDTO mapToScreenerDTO(Stock stock) {
        StockScreenerResponseDTO stockScreenerResponseDTO = new StockScreenerResponseDTO();
        stockScreenerResponseDTO.setStockName(stock.getStockName());
        stockScreenerResponseDTO.setStockSymbol(stock.getStockSymbol());
        stockScreenerResponseDTO.setCompanyResponseDTO(modelMapper.map(stock.getCompany(), CompanyResponseDTO.class));
        stockScreenerResponseDTO.setStockFinancialsDTO(modelMapper.map(stock.getStockFinancials(), StockFinancialsDTO.class));
        return stockScreenerResponseDTO;
    }
}
