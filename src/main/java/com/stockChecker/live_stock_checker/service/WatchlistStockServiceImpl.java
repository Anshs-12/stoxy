package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.config.AuthUtils;
import com.stockChecker.live_stock_checker.exceptions.ResourceExistsException;
import com.stockChecker.live_stock_checker.exceptions.ResourceNotFoundException;
import com.stockChecker.live_stock_checker.mapper.WatchlistResponseMapper;
import com.stockChecker.live_stock_checker.mapper.WatchlistStockMapper;
import com.stockChecker.live_stock_checker.mapper.WatchlistSummaryMapper;
import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.model.User;
import com.stockChecker.live_stock_checker.model.Watchlist;
import com.stockChecker.live_stock_checker.model.WatchlistStock;
import com.stockChecker.live_stock_checker.payload.StockPayload.StockSearchDTO;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.*;
import com.stockChecker.live_stock_checker.repository.StockRepository;
import com.stockChecker.live_stock_checker.repository.WatchlistRepository;
import com.stockChecker.live_stock_checker.repository.WatchlistStockRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor

public class WatchlistStockServiceImpl implements WatchlistService {

    // Repositories
    private final StockRepository stockRepository;
    private final WatchlistRepository watchlistRepository;
    private final WatchlistStockRepository watchlistStockRepository;

    private final AuthUtils authUtils;

    private final StockDBService stockDBService;

    // Mappers
    private final WatchlistSummaryMapper watchlistSummaryMapper;
    private final WatchlistStockMapper watchlistStockMapper;
    private final WatchlistResponseMapper watchlistResponseMapper;

    // creating a new Watchlist
    @Override
    public WatchlistResponseDTO createWatchlist(String userEmail, CreateWatchRequestDTO createWatchRequestDTO) {
        String watchlistName = createWatchRequestDTO.getWatchlistName();
        User loggedInUser = authUtils.getloggedInUser(userEmail);

        // checking first if the sameName watchlist already exists for the user!
        if (watchlistRepository.existsByNameAndUser(watchlistName, loggedInUser)) {
            log.warn("Duplicate watchlist name - user: {}, name: {}", userEmail, watchlistName);
            throw new ResourceExistsException("Watchlist with this name already exists!");
        }

        Watchlist newWatchlist = Watchlist.builder()
                .name(watchlistName)
                .createdAt(LocalDateTime.now())
                .user(loggedInUser)
                .watchlistStockList(new ArrayList<>())
                .build();
        watchlistRepository.save(newWatchlist);
        log.info("Watchlist created - user: {}, name: {}", userEmail, watchlistName);

        return watchlistResponseMapper.toResponseDTO(newWatchlist);
    }

    // getting all Watchlists of the loggedInUser!
    @Override
    public List<WatchlistSummaryDTO> getAllWatchlists(String userEmail) {
        User loggedInUser = authUtils.getloggedInUser(userEmail);
        List<Watchlist> watchlistList = watchlistRepository.findByUser(loggedInUser);
        return watchlistSummaryMapper.toSummaryDTOList(watchlistList);
    }

    @Override
    @Transactional
    public WatchlistStockResponseDTO addStockToWatchlist(String userEmail, Long watchlistId, WatchlistStockRequestDTO watchlistStockRequestDTO) {

        Stock stock = stockRepository.findByUpstoxInstrumentKey(watchlistStockRequestDTO.getInstrumentKey())
                .orElseGet(() -> {
                    StockSearchDTO stockSearchDTO = StockSearchDTO.builder()
                            .stockName("")
                            .stockSymbol(watchlistStockRequestDTO.getStockSymbol())
                            .companyName("")
                            .exchange("")
                            .instrumentKey(watchlistStockRequestDTO.getInstrumentKey())
                            .isin(watchlistStockRequestDTO.getIsin())
                            .build();
                    log.info("Watchlist add - stock not found in DB, " +
                            "saving new stock - instrumentKey: {}", watchlistStockRequestDTO.getInstrumentKey());
                    return stockDBService.saveAllStockExchanges(stockSearchDTO);
                });

        Watchlist watchlist = watchlistRepository.findByIdAndUser_UserMailId(watchlistId, userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(String.format("Watchlist with id %d not found for user %s", watchlistId, userEmail)));

        if (watchlistStockRepository.existsByWatchListAndStock(watchlist, stock)) {
            log.warn("Duplicate stock in watchlist - watchlistId: {}, symbol: {}", watchlistId, watchlistStockRequestDTO.getStockSymbol());
            throw new ResourceExistsException("Stock already exists in the specified watchlist");
        }

        WatchlistStock newWatchlistStock = WatchlistStock.builder()
                .watchList(watchlist)
                .stock(stock)
                .priceAddedAt(watchlistStockRequestDTO.getPriceAddedAt())
                .addedAt(LocalDateTime.now())
                .build();
        watchlistStockRepository.save(newWatchlistStock);
        log.info("Stock added to watchlist - watchlistId: {}, symbol: {}", watchlistId, watchlistStockRequestDTO.getStockSymbol());
        return watchlistStockMapper.toWatchlistStockResponseDTO(newWatchlistStock);
    }

    @Override
    @Transactional
    public void deleteStockFromWatchlist(String userEmail, Long watchlistId, String instrumentKey) {

        Watchlist watchlist = watchlistRepository.findByIdAndUser_UserMailId(watchlistId, userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(String.format("Watchlist with id %d not found for user %s", watchlistId, userEmail)));

        if (!watchlistStockRepository.existsByWatchListAndStock_UpstoxInstrumentKey(watchlist, instrumentKey)) {
            log.warn("Stock not found in watchlist - watchlistId: {}, instrumentKey: {}", watchlistId, instrumentKey);
            throw new ResourceNotFoundException("Stock not found in this watchlist");
        }
        watchlistStockRepository.deleteByWatchListAndStock_UpstoxInstrumentKey(watchlist, instrumentKey);
        log.info("Stock removed from watchlist - watchlistId: {}, instrumentKey: {}", watchlistId, instrumentKey);
    }

    @Override
    @Transactional
    public WatchlistResponseDTO getWatchlistById(String userEmail, Long watchlistId) {
        // retrieving the watchlist user requested.
        Watchlist watchlist = watchlistRepository.findByIdAndUser_UserMailId(watchlistId, userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Watchlist not found"));

        return watchlistResponseMapper.toResponseDTO(watchlist);

        // Transactional annotation is necessary here since we want to load the watchlistStock when fetching watchlist,
        // so this annotation keeps the connection on until it all things are mapped and used, otherwise the connection
        // gets closed as the watchlist is retrieved so when Mapper requires watchlistStock for creating the list, it throws
        // lazy error!
    }

    @Override
    @Transactional
    public void deleteWatchlistById(String userEmail, Long watchlistId) {
        Watchlist watchlist = watchlistRepository.findByIdAndUser_UserMailId(watchlistId, userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Watchlist not found"));
        watchlistRepository.delete(watchlist);
        log.info("Watchlist deleted - user: {}, watchlistId: {}", userEmail, watchlistId);
    }
}
