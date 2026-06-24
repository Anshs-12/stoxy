package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.config.AuthUtils;
import com.stockChecker.live_stock_checker.exceptions.InsufficientQuantityException;
import com.stockChecker.live_stock_checker.exceptions.ResourceNotFoundException;
import com.stockChecker.live_stock_checker.exceptions.UpstoxFeedException;
import com.stockChecker.live_stock_checker.mapper.PortfolioTransactionMapper;
import com.stockChecker.live_stock_checker.model.*;
import com.stockChecker.live_stock_checker.payload.PortfolioPayload.*;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;
import com.stockChecker.live_stock_checker.payload.WebsocketPayload.LtpcDataDTO;
import com.stockChecker.live_stock_checker.repository.PortfolioRepository;
import com.stockChecker.live_stock_checker.repository.PortfolioStockRepository;
import com.stockChecker.live_stock_checker.repository.PortfolioTransactionRepository;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioServiceImpl implements PortfolioService {

    // Repositories
    private final StockRepository stockRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortfolioStockRepository portfolioStockRepository;
    private final PortfolioTransactionRepository portfolioTransactionRepository;

    // Services
    private final StockDBService stockDBService;
    private final PDFService pdfService;
    private final TickerService tickerService;
    private final MarketStatusService marketStatusService;

    // Mapper & Utils
    private final PortfolioTransactionMapper transactionMapper;
    private final AuthUtils authUtils;

    @Override
    @Transactional
    public PortfolioResponseDTO getPortfolio(String userEmail) {
        log.info("Fetching portfolio - user: {}", userEmail);
        User user = authUtils.getloggedInUser(userEmail);

        Optional<Portfolio> portfolioExists = portfolioRepository.findByUser(user);
        if (portfolioExists.isEmpty()) {
            log.info("No portfolio found, returning demo data - user: {}", userEmail);
            return demoPortfolio();
        }
        Portfolio portfolio = portfolioExists.get();

        BigDecimal totalInvestedValue = BigDecimal.ZERO;

        List<PortfolioStock> portfolioStocksList = portfolioStockRepository
                .findByPortfolio(portfolio);

        List<String> instrumentKeys = portfolioStocksList.stream()
                .map(stock -> stock.getStock().getUpstoxInstrumentKey())
                .toList();

        Map<String, LtpcDataDTO> liveDataList = tickerService.getLiveLtpcData(instrumentKeys);

        List<PortfolioStockResponseDTO> portfolioStockResponseDTOList = new ArrayList<>();

        Map<String, BigDecimal> sectorBreakdown = new HashMap<>();

        BigDecimal totalCurrentValue = BigDecimal.ZERO;
        BigDecimal totalUnrealizedPnL = BigDecimal.ZERO;
        BigDecimal totalDayPnL = BigDecimal.ZERO;

        for (PortfolioStock eachStock : portfolioStocksList) {
            String instrumentKey = eachStock.getStock().getUpstoxInstrumentKey();
            LtpcDataDTO liveData = liveDataList.get(instrumentKey);
            if (liveData == null) {
                log.warn("Live data not found for instrumentKey: {}. Skipping this stock in portfolio calculation.", instrumentKey);
                continue;
            }
            PortfolioStockResponseDTO eachPortfolioStockResponseDTO = getPortfolioStockResponse(eachStock, liveData);


            // --- global variables for the portfolio ---
            totalInvestedValue = totalInvestedValue.add(eachPortfolioStockResponseDTO.getInvestedAmount());
            totalCurrentValue = totalCurrentValue.add(eachPortfolioStockResponseDTO.getCurrentValue());
            totalUnrealizedPnL = totalUnrealizedPnL.add(eachPortfolioStockResponseDTO.getUnrealizedPnL());
            totalDayPnL = totalDayPnL.add(eachPortfolioStockResponseDTO.getDayPnL());


            // calculating the sector breakdown data for the portfolio level data.
            String eachStockSector = eachStock.getStock().getCompany().getSector();
            BigDecimal eachStockInvestedAmount = eachPortfolioStockResponseDTO.getInvestedAmount();
            sectorBreakdown.put(eachStockSector,
                    sectorBreakdown.getOrDefault(eachStockSector, BigDecimal.ZERO)
                            .add(eachStockInvestedAmount));


            portfolioStockResponseDTOList.add(eachPortfolioStockResponseDTO);
        }

        // calculating the percentage breakdown for each sector based on the total invested value in the portfolio.
        final BigDecimal finalTotalInvestedValue = totalInvestedValue;
        sectorBreakdown.replaceAll(
                (sector, investedAmount) ->
                        investedAmount.divide(finalTotalInvestedValue, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100))
        );

        BigDecimal totalUnrealizedPnLPercent = calculatePercentage(totalUnrealizedPnL, totalInvestedValue);
        BigDecimal totalDayPnLPercent = calculatePercentage(totalDayPnL, totalInvestedValue);

        log.info("Portfolio fetched - user: {}, totalInvestedValue: {}, stocksCount: {}, sectorBreakdown: {}"
                , userEmail, totalInvestedValue, portfolioStocksList.size(), sectorBreakdown);
        return PortfolioResponseDTO.builder()
                .portfolioId(portfolio.getId())
                .lastUpdatedAt(LocalDateTime.now())
                .totalInvestedValue(totalInvestedValue)
                .totalCurrentValue(totalCurrentValue)
                .totalUnrealizedPnL(totalUnrealizedPnL)
                .totalUnrealizedPnLPercent(totalUnrealizedPnLPercent)
                .totalDayPnL(totalDayPnL)
                .totalDayPnLPercent(totalDayPnLPercent)
                .stocks(portfolioStockResponseDTOList)
                .sectorBreakdown(sectorBreakdown)
                .build();
    }

    private PortfolioResponseDTO demoPortfolio() {
        return PortfolioResponseDTO.builder()
                .portfolioId(null)
                .lastUpdatedAt(LocalDateTime.now())
                .stocks(new ArrayList<>())
                .sectorBreakdown(new HashMap<>())
                .build();
    }

    private PortfolioStockResponseDTO getPortfolioStockResponse(PortfolioStock portfolioStock, LtpcDataDTO liveData) {

        BigDecimal avgBuyingPrice = portfolioStock.getAvgBuyPrice();
        BigDecimal totalQuantity = BigDecimal.valueOf(portfolioStock.getTotalQuantity());
        BigDecimal investedAmount = avgBuyingPrice.multiply(totalQuantity);

        // Mapping from your new LtpcDataDTO
        BigDecimal lastTradedPrice = liveData.getLastTradedPrice();
        BigDecimal previousClose = liveData.getClosePrice();

        BigDecimal currentValue = lastTradedPrice.multiply(totalQuantity);

        BigDecimal unrealizedPnL = currentValue.subtract(investedAmount);
        BigDecimal unrealizedPnLPercent = calculatePercentage(unrealizedPnL, investedAmount);

        BigDecimal dayPnL = lastTradedPrice.subtract(previousClose).multiply(totalQuantity);
        BigDecimal dayPnLPercent = calculatePercentage(lastTradedPrice.subtract(previousClose), previousClose);

        return PortfolioStockResponseDTO.builder()
                .stockName(portfolioStock.getStock().getStockName())
                .stockSymbol(portfolioStock.getStock().getStockSymbol())
                .instrumentKey(portfolioStock.getStock().getUpstoxInstrumentKey())
                .avgBuyingPrice(avgBuyingPrice)
                .totalQuantity(portfolioStock.getTotalQuantity())
                .investedAmount(investedAmount)
                .currentValue(currentValue)
                .ltp(lastTradedPrice)
                .unrealizedPnL(unrealizedPnL)
                .unrealizedPnLPercent(unrealizedPnLPercent)
                .dayPnL(dayPnL)
                .dayPnLPercent(dayPnLPercent)
                .build();
    }

    private BigDecimal calculatePercentage(BigDecimal part, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return part.divide(total, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
    }

    @Override
    @Transactional
    public BuyStockResponseDTO buyStock(String userEmail, BuyStockRequestDTO buyStockRequestDTO) {
        if (!marketStatusService.isMarketOpen().getIsOpen()) {
            throw new IllegalStateException("Market is currently closed. Trading is only allowed during market hours.");
        }
        // getting the user first to get the related portfolio
        User user = authUtils.getloggedInUser(userEmail);

        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseGet(() -> portfolioRepository.save(
                        Portfolio.builder()
                                .user(user)
                                .createdAt(LocalDateTime.now())
                                .build()));

        // getting the stock Object to fill in the details!
        Stock stock = stockRepository.findByUpstoxInstrumentKey(buyStockRequestDTO.getInstrumentKey())
                .orElseGet(() -> {
                    StockSearchDTO stockSearchDTO = StockSearchDTO.builder()
                            .stockName("")
                            .stockSymbol(buyStockRequestDTO.getStockSymbol())
                            .companyName("")
                            .exchange("")
                            .instrumentKey(buyStockRequestDTO.getInstrumentKey())
                            .isin(buyStockRequestDTO.getIsin())
                            .build();
                    log.info("Portfolio buy - stock not found in DB, " +
                            "saving new stock - instrumentKey: {}", buyStockRequestDTO.getInstrumentKey());
                    return stockDBService.saveAllStockExchanges(stockSearchDTO);
                });

        log.info("Buying stock - user: {}, instrumentKey: {}, quantity: {}, expectedPrice: {}"
                , userEmail, buyStockRequestDTO.getInstrumentKey(),
                buyStockRequestDTO.getQuantity(), buyStockRequestDTO.getBuyPrice());
        return executeBuyStock(buyStockRequestDTO, stock, portfolio);
    }

    private BuyStockResponseDTO executeBuyStock(BuyStockRequestDTO buyStockRequestDTO,
                                                Stock stock,
                                                Portfolio portfolio) {

        // checking if the portfolio already has the stock present so the details get updated!
        String requestedStockSymbol = stock.getStockSymbol();

        Optional<PortfolioStock> existing =
                portfolioStockRepository.findByPortfolioAndStock_upstoxInstrumentKey(portfolio, buyStockRequestDTO.getInstrumentKey());
        BigDecimal expectedPrice = buyStockRequestDTO.getBuyPrice();
        String instrumentKey = buyStockRequestDTO.getInstrumentKey();

        final BigDecimal liveStockPrice = getLiveStockPrice(instrumentKey, expectedPrice);

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
                .instrumentKey(stock.getUpstoxInstrumentKey())
                .transactionAt(LocalDateTime.now())
                .type(TransactionType.BUY)
                .quantity(buyStockRequestDTO.getQuantity())
                .price(liveStockPrice)
                .build();

        portfolioTransactionRepository.save(portfolioTransaction);
        log.info("Stock bought - portfolioId: {}, instrumentKey: {}, quantity: {}, price: {}"
                , portfolio.getId(), instrumentKey, buyStockRequestDTO.getQuantity(), liveStockPrice);
        return BuyStockResponseDTO.builder()
                .stockSymbol(requestedStockSymbol)
                .instrumentKey(buyStockRequestDTO.getInstrumentKey())
                .buyPrice(liveStockPrice)
                .quantityBought(buyStockRequestDTO.getQuantity())
                .boughtAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional
    public SellStockResponseDTO sellStock(String userEmail, SellStockRequestDTO sellStockRequestDTO) {
        if (!marketStatusService.isMarketOpen().getIsOpen()) {
            throw new IllegalStateException("Market is currently closed. Trading is only allowed during market hours.");
        }
        User user = authUtils.getloggedInUser(userEmail);
        // checking if the portfolio exists!
        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("No portfolio exists for the user!"));

        // checking if the stock exists!
        PortfolioStock portfolioStock = portfolioStockRepository
                .findByPortfolioAndStock_upstoxInstrumentKey(portfolio, sellStockRequestDTO.getInstrumentKey())
                .orElseThrow(() ->
                        new ResourceNotFoundException("There is no stock to sell with the name: "
                                + sellStockRequestDTO.getStockSymbol()));

        // checking if the requestedQuantity is less than the portfolio quantity present!
        if (sellStockRequestDTO.getQuantity() > portfolioStock.getTotalQuantity()) {
            log.warn("Sell rejected - insufficient quantity - instrumentKey: {}, requested: {}, available: {}"
                    , sellStockRequestDTO.getInstrumentKey(), sellStockRequestDTO.getQuantity(), portfolioStock.getTotalQuantity());
            throw new InsufficientQuantityException(
                    String.format(
                            "Requested sell quantity (%d) exceeds available quantity (%d).",
                            sellStockRequestDTO.getQuantity(),
                            portfolioStock.getTotalQuantity()
                    )
            );
        }
        log.info("Selling stock - user: {}, instrumentKey: {}, quantity: {}, expectedPrice: {}"
                , userEmail, sellStockRequestDTO.getInstrumentKey(),
                sellStockRequestDTO.getQuantity(), sellStockRequestDTO.getSellingPrice());
        return executeSellStock(sellStockRequestDTO, portfolioStock, portfolio);
    }

    private SellStockResponseDTO executeSellStock(
            SellStockRequestDTO sellStockRequestDTO,
            PortfolioStock portfolioStock,
            Portfolio portfolio) {

        String requestStockSymbol = portfolioStock.getStock().getStockSymbol();

        BigDecimal expectedPrice = sellStockRequestDTO.getSellingPrice();
        String instrumentKey = sellStockRequestDTO.getInstrumentKey();

        BigDecimal liveStockPrice = getLiveStockPrice(instrumentKey, expectedPrice);

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
                .stockSymbol(requestStockSymbol)
                .instrumentKey(instrumentKey)
                .quantity(sellStockRequestDTO.getQuantity())
                .price(liveStockPrice)
                .type(TransactionType.SELL)
                .transactionAt(LocalDateTime.now())
                .build();

        portfolioTransactionRepository.save(portfolioTransaction);

        log.info("Stock sold - portfolioId: {}, instrumentKey: {}, quantity: {}, price: {}, realizedPnL: {}"
                , portfolio.getId(), instrumentKey, sellStockRequestDTO.getQuantity(), liveStockPrice, realizedPnL);
        return SellStockResponseDTO.builder()
                .stockSymbol(requestStockSymbol)
                .instrumentKey(instrumentKey)
                .sellPrice(liveStockPrice)
                .quantitySold(sellStockRequestDTO.getQuantity())
                .realizedProfitLoss(realizedPnL)
                .soldAt(LocalDateTime.now())
                .build();
    }

    /*
        This is the critical part of the buy flow, where we are checking the live price of
            the stock with the expected price sent by the user in the request.
        If the price difference is more than 1% then we are rejecting the order and
            asking the user to retry with the updated price.
    */
    private BigDecimal getLiveStockPrice(String instrumentKey, BigDecimal expectedPrice) {
        LtpcDataDTO liveData = tickerService.getLiveLtpcData(List.of(instrumentKey))
                .get(instrumentKey);

        if (liveData == null || liveData.getLastTradedPrice() == null) {
            log.warn("Live price unavailable - instrumentKey: {}. Order rejected.", instrumentKey);
            throw new UpstoxFeedException("Live price unavailable for: " + instrumentKey + ". Order rejected.");
        }

        BigDecimal actualPrice = liveData.getLastTradedPrice();
        BigDecimal percentDiff = actualPrice.subtract(expectedPrice).abs()
                .divide(expectedPrice, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        if (percentDiff.compareTo(BigDecimal.valueOf(1.0)) > 0) {
            log.warn("Order rejected - price slippage exceeded - instrumentKey: {}, expected: {}, actual: {}, diff%: {}"
                    , instrumentKey, expectedPrice, actualPrice, percentDiff);
            throw new UpstoxFeedException("Order rejected due to price slippage. Expected: "
                    + expectedPrice + ", Actual: " + actualPrice + ". Please retry.");
        }

        return actualPrice;
    }

    // this method gets back the transaction history as per the stock!;
    @Override
    @Transactional
    public List<TransactionResponseDTO> getTransactionsByStock(String userEmail, String stockSymbol) {

        User user = authUtils.getloggedInUser(userEmail);
        // checking if the portfolio exists!
        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("No portfolio exists for the user!"));


        List<PortfolioTransaction> transactionsList =
                portfolioTransactionRepository.findByPortfolioAndStockSymbol(portfolio, stockSymbol);
        if (transactionsList.isEmpty()) {
            log.warn("No transactions found - user: {}, symbol: {}", userEmail, stockSymbol);
            throw new ResourceNotFoundException("Never bought/sold this stock!");
        }
        log.info("Transactions fetched - user: {}, symbol: {}, transactionsCount: {}"
                , userEmail, stockSymbol, transactionsList.size());
        return transactionMapper.toResponseDTOList(transactionsList);
    }

    @Override
    @Transactional
    public List<TransactionResponseDTO> getTransactionHistory(String userEmail) {
        User user = authUtils.getloggedInUser(userEmail);
        // checking if the portfolio exists!
        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("No portfolio exists for the user!"));

        List<PortfolioTransaction> transactionHistoryList =
                portfolioTransactionRepository.findByPortfolioOrderByTransactionAtDesc(portfolio);
        if (transactionHistoryList.isEmpty()) {
            log.warn("No transaction history - user: {}", userEmail);
            throw new ResourceNotFoundException("Please buy/sell stocks to generate a transaction history!");
        }
        log.info("Transaction history fetched - user: {}, transactionsCount: {}"
                , userEmail, transactionHistoryList.size());
        return transactionMapper.toResponseDTOList(transactionHistoryList);
    }

    @Override
    @Transactional
    public byte[] getTransactionHistoryPDF(String userEmail) {
        List<TransactionResponseDTO> transactionsList = getTransactionHistory(userEmail);
        byte[] transactionsPDF = pdfService.generateTransactionsPDF(transactionsList);
        log.info("Transaction history PDF generated - user: {}, transactionsCount: {}, pdfSizeBytes: {}"
                , userEmail, transactionsList.size(), transactionsPDF.length);
        return transactionsPDF;
    }
}