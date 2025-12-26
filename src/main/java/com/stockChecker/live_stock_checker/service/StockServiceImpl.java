package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.payload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockSearchResponseDTO;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class StockServiceImpl implements StockService {

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private ModelMapper modelMapper;
    /*
        entire flow, first checking if the stock exits in database,
        if not then we call to save into the Database, and then it returns that stock back.
    */

    @Override
    public StockDetailResponseDTO getStockBySymbol(String symbol) {
        Stock stockFound = stockRepository.findByStockSymbol(symbol)
                .orElseGet(() -> saveStockInDB(symbol));
        StockDetailResponseDTO stockFoundDTO = modelMapper.map(stockFound, StockDetailResponseDTO.class);
        return stockFoundDTO;
    }

    // private method which is being used in implementation and not allowed outside
    private Stock saveStockInDB(String symbol) {
        Stock newStock = Stock.builder()
                .stockName("ABC")
                .stockWebsite("abc.com")
                .listedExchangeName("NSE")
                .aboutStock("this is a stock related to NSE StockExchange")
                .stockSymbol(symbol)
                .build();
        return stockRepository.save(newStock);
    }

    @Override
    public List<StockSearchResponseDTO> searchStockByName(String query) {
        // spring data jpa translate's Containing to LIKE %VALUE%
        List<Stock> stockList = stockRepository.findByStockNameContainingIgnoreCaseOrStockSymbolContainingIgnoreCase(query, query);
        List<StockSearchResponseDTO> stockResponse = stockList.stream()
                .map((eachStock) ->
                        modelMapper.map(eachStock, StockSearchResponseDTO.class))
                .toList();
        return stockResponse;
    }
}
