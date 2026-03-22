package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.config.AuthUtils;
import com.stockChecker.live_stock_checker.exceptions.InsufficientQuantityException;
import com.stockChecker.live_stock_checker.exceptions.ResourceNotFoundException;
import com.stockChecker.live_stock_checker.exceptions.StockNotFoundException;
import com.stockChecker.live_stock_checker.model.*;
import com.stockChecker.live_stock_checker.payload.PortfolioPayload.*;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockDetailResponseDTO;
import com.stockChecker.live_stock_checker.repository.PortfolioRepository;
import com.stockChecker.live_stock_checker.repository.PortfolioStockRepository;
import com.stockChecker.live_stock_checker.repository.PortfolioTransactionRepository;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PortfolioServiceImpl implements PortfolioService {

    private final StockRepository stockRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortfolioStockRepository portfolioStockRepository;
    private final PortfolioTransactionRepository portfolioTransactionRepository;

    private final StockCacheService stockCacheService;

    private final AuthUtils authUtils;

    @Override
    public PortfolioResponseDTO getPortfolio(String userEmail) {
        return null;
    }

    @Override
    @Transactional
    public BuyStockResponseDTO buyStock(String userEmail, BuyStockRequestDTO buyStockRequestDTO) {

        // getting the user first to get the related portfolio

        User user = authUtils.getloggedInUser(userEmail);

        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseGet(() -> portfolioRepository.save(
                        Portfolio.builder()
                                .user(user)
                                .createdAt(LocalDateTime.now())
                                .build()));

        // getting the stock Object to fill in the details!
        String requestedStockSymbol = buyStockRequestDTO.getStockSymbol();

        Stock stock = stockRepository.findByStockSymbol(requestedStockSymbol)
                .orElseThrow(() -> new StockNotFoundException("Stock does not exist with stockSymbol: " + requestedStockSymbol));

        StockDetailResponseDTO stockDetailResponseDTO = stockCacheService.getStockLive(requestedStockSymbol);

        // checking if the portfolio already has the stock present so the details get updated!

        Optional<PortfolioStock> existing = portfolioStockRepository.findByPortfolioAndStock_stockSymbol(portfolio, requestedStockSymbol);
        BigDecimal liveStockPrice = stockDetailResponseDTO.getStockPriceInfoDTO().getLastPrice();
        if (existing.isPresent()) {
            PortfolioStock portfolioStock = existing.get();

            int totalQuantity = portfolioStock.getTotalQuantity() + buyStockRequestDTO.getQuantity();

            BigDecimal existingInvested = portfolioStock.getAvgBuyPrice().multiply(BigDecimal.valueOf(portfolioStock.getTotalQuantity()));
            BigDecimal newInvested = liveStockPrice.multiply(BigDecimal.valueOf(buyStockRequestDTO.getQuantity()));
            BigDecimal totalInvested = existingInvested.add(newInvested);
            BigDecimal newAvgBuyPrice = totalInvested.divide(BigDecimal.valueOf(totalQuantity), 2, RoundingMode.HALF_UP);

            portfolioStock.setTotalQuantity(totalQuantity);
            portfolioStock.setAvgBuyPrice(newAvgBuyPrice);


            portfolioStockRepository.save(portfolioStock);
        } else {
            // the portfolio doesn't have this stock yet, so creating a new PortfolioStock.
            PortfolioStock portfolioStock = PortfolioStock.builder()
                    .totalQuantity(buyStockRequestDTO.getQuantity())
                    .portfolio(portfolio)
                    .stock(stock)
                    .avgBuyPrice(liveStockPrice)
                    .build();


            portfolioStockRepository.save(portfolioStock);

        }

        PortfolioTransaction portfolioTransaction = PortfolioTransaction.builder()
                .portfolio(portfolio)
                .stockSymbol(requestedStockSymbol)
                .transactionDate(LocalDateTime.now())
                .type(TransactionType.BUY)
                .quantity(buyStockRequestDTO.getQuantity())
                .price(liveStockPrice)
                .build();

        portfolioTransactionRepository.save(portfolioTransaction);

        return BuyStockResponseDTO.builder()
                .stockSymbol(requestedStockSymbol)
                .price(stockDetailResponseDTO.getStockPriceInfoDTO().getLastPrice())
                .quantity(buyStockRequestDTO.getQuantity())
                .boughtAt(LocalDateTime.now())
                .build();

    }

    @Override
    @Transactional
    public SellStockResponseDTO sellStock(String userEmail, SellStockRequestDTO sellStockRequestDTO) {

        User user = authUtils.getloggedInUser(userEmail);
        // checking if the portfolio exists!
        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("No portfolio exists for the user!"));

        // checking if the stock exists!
        String requestStockSymbol = sellStockRequestDTO.getStockSymbol();
        PortfolioStock portfolioStock = portfolioStockRepository.findByPortfolioAndStock_stockSymbol(portfolio, requestStockSymbol)
                .orElseThrow(() -> new ResourceNotFoundException("There is no stock to sell with the name: " + requestStockSymbol));

        // checking if the requestedQuantity is less than the portfolio quantity present!
        if (portfolioStock.getTotalQuantity() < sellStockRequestDTO.getQuantity()) {
            throw new InsufficientQuantityException("Insufficient quantity of Stocks being sold, " +
                    "Please reduce the quantity to or below: " + portfolioStock.getTotalQuantity());
        }

        StockDetailResponseDTO liveStock = stockCacheService.getStockLive(requestStockSymbol);


        return executeSellStock(liveStock, sellStockRequestDTO, portfolioStock, portfolio);
    }

    private SellStockResponseDTO executeSellStock(StockDetailResponseDTO liveStock,
                                                  SellStockRequestDTO sellStockRequestDTO,
                                                  PortfolioStock portfolioStock,
                                                  Portfolio portfolio) {
        BigDecimal liveStockPrice = liveStock.getStockPriceInfoDTO().getLastPrice();
        BigDecimal quantityBeingSold = BigDecimal.valueOf(sellStockRequestDTO.getQuantity());

        BigDecimal realizedPnL = liveStockPrice.multiply(quantityBeingSold)
                .subtract(portfolioStock.getAvgBuyPrice().multiply(quantityBeingSold));

        if (Objects.equals(portfolioStock.getTotalQuantity(), sellStockRequestDTO.getQuantity())) {
            // the entire stock is being deleted so its entity even;
            portfolioStockRepository.delete(portfolioStock);
        } else {
            Integer updatedQuantity = portfolioStock.getTotalQuantity() - sellStockRequestDTO.getQuantity();
            portfolioStock.setTotalQuantity(updatedQuantity);
            portfolioStockRepository.save(portfolioStock);
        }

        PortfolioTransaction portfolioTransaction = PortfolioTransaction.builder()
                .portfolio(portfolio)
                .stockSymbol(sellStockRequestDTO.getStockSymbol())
                .quantity(sellStockRequestDTO.getQuantity())
                .price(liveStockPrice)
                .type(TransactionType.SELL)
                .transactionDate(LocalDateTime.now())
                .build();

        portfolioTransactionRepository.save(portfolioTransaction);

        return SellStockResponseDTO.builder()
                .stockSymbol(sellStockRequestDTO.getStockSymbol())
                .price(liveStockPrice)
                .quantitySold(sellStockRequestDTO.getQuantity())
                .realizedPnL(realizedPnL)
                .soldAt(LocalDateTime.now())
                .build();


    }
}









