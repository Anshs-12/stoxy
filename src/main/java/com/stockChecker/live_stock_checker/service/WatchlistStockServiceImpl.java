package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.config.AuthUtils;
import com.stockChecker.live_stock_checker.exceptions.ResourceExistsException;
import com.stockChecker.live_stock_checker.exceptions.ResourceNotFoundException;
import com.stockChecker.live_stock_checker.exceptions.StockNotFoundException;
import com.stockChecker.live_stock_checker.mapper.WatchlistStockMapper;
import com.stockChecker.live_stock_checker.mapper.WatchlistSummaryMapper;
import com.stockChecker.live_stock_checker.model.Stock;
import com.stockChecker.live_stock_checker.model.User;
import com.stockChecker.live_stock_checker.model.Watchlist;
import com.stockChecker.live_stock_checker.model.WatchlistStock;
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

    private final WatchlistRepository watchlistRepository;

    private final WatchlistStockRepository watchlistStockRepository;

    private final AuthUtils authUtils;

    private final WatchlistSummaryMapper watchlistSummaryMapper;

    private final StockRepository stockRepository;

    private final StockService stockService;

    private final WatchlistStockMapper watchlistStockMapper;

    // creating a new Watchlist
    public WatchlistResponseDTO createWatchlist(String userEmail, CreateWatchRequestDTO createWatchRequestDTO) {
        String watchlistName = createWatchRequestDTO.getWatchlistName();
        User loggedInUser = authUtils.getloggedInUser(userEmail);

        // checking first if the sameName watchlist already exists for the user!
        if (watchlistRepository.existsByNameAndUser(watchlistName, loggedInUser)) {
            throw new ResourceExistsException("Watchlist with this name already exists!");
        }

        Watchlist newWatchlist = Watchlist.builder()
                .name(watchlistName)
                .createdAt(LocalDateTime.now())
                .user(loggedInUser)
                .watchlist(new ArrayList<>())
                .build();
        watchlistRepository.save(newWatchlist);


        List<WatchlistStockResponseDTO> watchlistStockResponseDTOList =
                newWatchlist.getWatchlist()
                        .stream()
                        .map((eachObject) -> {
                            WatchlistStockResponseDTO watchlistStockResponseDTO = new WatchlistStockResponseDTO();
                            watchlistStockResponseDTO.setStockName(eachObject.getStock().getStockName());
                            watchlistStockResponseDTO.setStockSymbol(eachObject.getStock().getStockSymbol());
                            watchlistStockResponseDTO.setPriceAddedAt(eachObject.getPriceAddedAt());
                            watchlistStockResponseDTO.setAddedAt(eachObject.getAddedAt());
                            return watchlistStockResponseDTO;
                        })
                        .toList();

        WatchlistResponseDTO watchlistResponseDTO = new WatchlistResponseDTO();
        watchlistResponseDTO.setWatchlistName(newWatchlist.getName());
        watchlistResponseDTO.setCreatedAt(newWatchlist.getCreatedAt());
        watchlistResponseDTO.setWatchlistStockDTO(new ArrayList<>());
        return watchlistResponseDTO;
    }

    // getting all Watchlists of the loggedInUser!
    @Override
    public List<WatchlistSummaryDTO> getAllWatchlists(String userEmail) {
        User loggedInUser = authUtils.getloggedInUser(userEmail);
        List<Watchlist> watchlistList = watchlistRepository.findByUser(loggedInUser);

//        // adding a safety net if the watchlists are empty!
//        if (watchlistList.isEmpty())
//            throw new ResourceNotFoundException("No Watchlists created till now!");

        return watchlistSummaryMapper.toSummaryDTOList(watchlistList);

    }

    @Override
    @Transactional
    public WatchlistStockResponseDTO addStockToWatchlist(String userEmail, Long watchlistId, WatchlistStockRequestDTO watchlistStockRequestDTO) {

        Stock stock = stockRepository.findByStockSymbol(watchlistStockRequestDTO.getStockSymbol())
                .orElseThrow(() -> new StockNotFoundException("Stock not found: " + watchlistStockRequestDTO.getStockSymbol()));

        Watchlist watchlist = watchlistRepository.findByIdAndUser_UserMailId(watchlistId, userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Watchlist not found"));

        if (watchlistStockRepository.existsByWatchListAndStock(watchlist, stock)) {
            throw new ResourceExistsException("Stock already exists in the specified watchlist");
        }

        WatchlistStock newWatchlistStock = WatchlistStock.builder()
                .watchList(watchlist)
                .stock(stock)
                .priceAddedAt(stockService.getStockBySymbol(watchlistStockRequestDTO.getStockSymbol()).getStockPriceInfoDTO().getLastPrice())
                .addedAt(LocalDateTime.now())
                .build();
        watchlistStockRepository.save(newWatchlistStock);
        return watchlistStockMapper.toWatchlistStockResponseDTO(newWatchlistStock);
    }

    @Override
    @Transactional
    public void deleteStockFromWatchlist(String userEmail, Long watchlistId, WatchlistStockRequestDTO watchlistStockRequestDTO) {

        Watchlist watchlist = watchlistRepository.findByIdAndUser_UserMailId(watchlistId, userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Watchlist not found"));

        if (!watchlistStockRepository.existsByWatchListAndStock_StockSymbol(watchlist, watchlistStockRequestDTO.getStockSymbol())) {
            throw new ResourceNotFoundException("Stock not found in this watchlist");
        }
        watchlistStockRepository.deleteByWatchListAndStock_StockSymbol(watchlist, watchlistStockRequestDTO.getStockSymbol());
    }
}
