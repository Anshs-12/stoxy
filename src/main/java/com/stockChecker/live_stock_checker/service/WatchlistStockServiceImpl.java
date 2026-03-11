package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.config.AuthUtils;
import com.stockChecker.live_stock_checker.exceptions.ResourceExistsException;
import com.stockChecker.live_stock_checker.model.User;
import com.stockChecker.live_stock_checker.model.Watchlist;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.CreateWatchRequestDTO;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.WatchlistResponseDTO;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.WatchlistStockResponseDTO;
import com.stockChecker.live_stock_checker.repository.WatchlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor

public class WatchlistStockServiceImpl implements WatchlistService {

    private final WatchlistRepository watchlistRepository;

    private final AuthUtils authUtils;

    private final ModelMapper modelMapper;

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
}
