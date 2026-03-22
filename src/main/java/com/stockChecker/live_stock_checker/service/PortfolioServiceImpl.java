package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.config.AuthUtils;
import com.stockChecker.live_stock_checker.exceptions.StockNotFoundException;
import com.stockChecker.live_stock_checker.model.*;
import com.stockChecker.live_stock_checker.payload.PortfolioPayload.BuyStockRequestDTO;
import com.stockChecker.live_stock_checker.payload.PortfolioPayload.PortfolioResponseDTO;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PortfolioServiceImpl implements PortfolioService {

    private final StockRepository stockRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortfolioStockRepository portfolioStockRepository;
    private final PortfolioTransactionRepository portfolioTransactionRepository;

    private final UserRepository userRepository;

    private final StockCacheService stockCacheService;

    private final AuthUtils authUtils;

    @Override
    public PortfolioResponseDTO getPortfolio(String userEmail) {
        return null;
    }

    @Override
    public String buyStock(String userEmail, BuyStockRequestDTO buyStockRequestDTO) {

        // getting the user first to get the related portfolio

        User user = authUtils.getloggedInUser(userEmail);

        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseGet(() -> {
                    Portfolio newPortfolio = Portfolio.builder()
                            .user(user)
                            .createdAt(LocalDateTime.now())
                            .build();

                    portfolioRepository.save(newPortfolio);
                    return newPortfolio;
                });

        // getting the stock Object to fill in the details!
        String requestedStockSymbol = buyStockRequestDTO.getStockSymbol();

        Stock stock = stockRepository.findByStockSymbol(requestedStockSymbol)
                .orElseThrow(() -> new StockNotFoundException("Stock does not exist with stockSymbol: " + requestedStockSymbol));

        StockDetailResponseDTO stockDetailResponseDTO = stockCacheService.getStockLive(requestedStockSymbol);

        // checking if the portfolio already has the stock present so the details get updated!

        Optional<PortfolioStock> existing = portfolioStockRepository.findByPortfolioAndStock_stockSymbol(portfolio, requestedStockSymbol);
        if (existing.isPresent()) {
            PortfolioStock portfolioStock = existing.get();

            int totalQuantity = portfolioStock.getTotalQuantity() + buyStockRequestDTO.getQuantity();

            BigDecimal existingInvested = portfolioStock.getAvgBuyPrice().multiply(BigDecimal.valueOf(portfolioStock.getTotalQuantity()));
            BigDecimal newInvested = stockDetailResponseDTO.getStockPriceInfoDTO().getLastPrice().multiply(BigDecimal.valueOf(buyStockRequestDTO.getQuantity()));
            BigDecimal totalInvested = existingInvested.add(newInvested);
            BigDecimal newAvgBuyPrice = totalInvested.divide(BigDecimal.valueOf(totalQuantity), 2, RoundingMode.HALF_UP);

            portfolioStock.setTotalQuantity(totalQuantity);
            portfolioStock.setAvgBuyPrice(newAvgBuyPrice);

            PortfolioTransaction portfolioTransaction = PortfolioTransaction.builder()
                    .portfolio(portfolio)
                    .stockSymbol(requestedStockSymbol)
                    .transactionDate(LocalDateTime.now())
                    .type(TransactionType.BUY)
                    .quantity(buyStockRequestDTO.getQuantity())
                    .price(stockDetailResponseDTO.getStockPriceInfoDTO().getLastPrice())
                    .build();

            portfolioStockRepository.save(portfolioStock);
            portfolioTransactionRepository.save(portfolioTransaction);
        } else {
            // the portfolio doesn't have this stock yet, so creating a new PortfolioStock.
            PortfolioStock portfolioStock = PortfolioStock.builder()
                    .totalQuantity(buyStockRequestDTO.getQuantity())
                    .portfolio(portfolio)
                    .stock(stock)
                    .avgBuyPrice(stockDetailResponseDTO.getStockPriceInfoDTO().getLastPrice())
                    .build();

            PortfolioTransaction portfolioTransaction = PortfolioTransaction.builder()
                    .portfolio(portfolio)
                    .stockSymbol(requestedStockSymbol)
                    .quantity(buyStockRequestDTO.getQuantity())
                    .price(stockDetailResponseDTO.getStockPriceInfoDTO().getLastPrice())
                    .type(TransactionType.BUY)
                    .transactionDate(LocalDateTime.now())
                    .build();

            portfolioStockRepository.save(portfolioStock);
            portfolioTransactionRepository.save(portfolioTransaction);
        }

        return "StockBought";
    }
}









