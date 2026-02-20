package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.payload.MarketStatusResponse;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockResponse;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchResponseDTO;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class StockServiceImpl implements StockService {

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private MarketStatusService marketStatusService;

    @Autowired
    private StockCacheService stockCacheService;

    /*
        entire flow, first checking if the stock exits in database,
        if not then we call to save into the Database, and then it returns that stock back.
    */

    @Override
    public StockDetailResponseDTO getStockBySymbol(String stockSymbol) throws JsonProcessingException {
        MarketStatusResponse response = marketStatusService.isMarketOpen();
        if (response.getIsOpen()) {
            return stockCacheService.getStockLive(stockSymbol);
        }
        if (response.getNextOpeningDay().equals("MONDAY")) {
            return stockCacheService.getStockWeekendClosed(stockSymbol);
        }
        return stockCacheService.getStockWeekdayClosed(stockSymbol);
    }

    @Override
    // this method needs no caching as it's used for seach bar when a user tries to search a stock name.
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
