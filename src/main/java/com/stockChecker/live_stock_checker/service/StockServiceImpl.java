package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.model.Company;
import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.payload.CompanyResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockResponse;
import com.stockChecker.live_stock_checker.payload.StockSearchResponseDTO;
import com.stockChecker.live_stock_checker.repository.CompanyRepository;
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
    private CompanyRepository companyRepository;

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
        // companyDTO remains empty so need to fix and fill that.
        if (stockFound.getCompany() != null) {
            CompanyResponseDTO companyResponseDTO = modelMapper.map(stockFound.getCompany(), CompanyResponseDTO.class);
            stockFoundDTO.setCompanyResponseDTO(companyResponseDTO);
        }
        return stockFoundDTO;
    }

    // private method which is being used in implementation and not allowed outside
    private Stock saveStockInDB(String symbol) {

        Stock newStock = Stock.builder()
                .stockName("ABC")
                .stockWebsite("abc.com")
                .listedExchangeName("NSE")
                .stockSymbol(symbol)
                .build();
        // as stock gets created we continue the creation of its company alongside as they are OneToOne mapped
        Company newCompany = Company.builder()
                .companyName(symbol + " company")
                .aboutCompany("this company works produces aircrafts")
                .sector("Industries")
                .industry("aerospace")
                .foundedYear(1980)
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
