package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.stockChecker.live_stock_checker.model.Company;
import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.model.StockFinancials;
import com.stockChecker.live_stock_checker.repository.CompanyRepository;
import com.stockChecker.live_stock_checker.repository.StockFinancialsRepository;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class StockDBService {

    // this class is made entirely for handling all the Stock Database related operations
    // as database related operations cannot be done in StockCacheService right and if these methods are
    // implemented in StockServiceImpl then we should be injected each of these classes in each other
    // which eventually  leads to circularDependency which should be avoided.

    private final StockRepository stockRepository;
    private final CompanyRepository companyRepository;
    private final StockFinancialsRepository stockFinancialsRepository;


    public Stock saveStockInDB(String symbol, JsonNode rootNode, JsonNode infoNode) {
        Stock newStock = Stock.builder()
                .stockName(infoNode.get("companyName").asText().toUpperCase())
                .stockWebsite(null)
                .listedExchangeName("NSE")
                .stockSymbol(infoNode.get("symbol").asText())
                .build();

        Company newCompany = Company.builder()
                .companyName(infoNode.get("companyName").asText())
                .aboutCompany("this company works is " + infoNode.get("companyName").asText())
                .sector(rootNode.get("industryInfo").get("sector").asText())
                .subIndustry(infoNode.get("industry").asText())
                .industry(rootNode.get("industryInfo").get("industry").asText())
                .listingDate(rootNode.get("metadata").get("listingDate").asText())
                .isIN(rootNode.get("metadata").get("isin").asText())
                .stock(newStock)
                .build();

        companyRepository.save(newCompany);
        newStock.setCompany(newCompany);
        newStock.setStockFinancials(saveStockFinancials(rootNode,newStock));
        return stockRepository.save(newStock);
    }

    public StockFinancials saveStockFinancials(JsonNode rootNode, Stock savedStock) {
        StockFinancials newStockFinancials = StockFinancials.builder()
                .pe(rootNode.get("metadata").get("pdSymbolPe").asDouble())
                .sectorPe(rootNode.get("metadata").get("pdSectorPe").asDouble())
                .faceValue(rootNode.get("securityInfo").get("faceValue").asInt())
                .issuedSize(rootNode.get("securityInfo").get("issuedSize").asLong())
                .stock(savedStock)
                .build();

        stockFinancialsRepository.save(newStockFinancials);
        return newStockFinancials;
    }
}
