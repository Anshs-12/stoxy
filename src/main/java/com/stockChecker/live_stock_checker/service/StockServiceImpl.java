package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.Specification.StockScreenerSpec;
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

import java.util.List;


@Service
@RequiredArgsConstructor
@Slf4j
public class StockServiceImpl implements StockService {

    private final StockRepository stockRepository;

    private final ModelMapper modelMapper;

    private final MarketStatusService marketStatusService;

    private final StockCacheService stockCacheService;

    /*
        entire flow, first checking if the stock exits in a database,
        if not, then we call to save into the Database, and then it returns that stock.
    */

    @Override
    public StockDetailResponseDTO getStockBySymbol(String stockSymbol) {
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
    // this method needs no caching as it's used for search bar when a user tries to search a stock name.
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
