package com.stockChecker.live_stock_checker.mapper;

import com.stockChecker.live_stock_checker.model.Watchlist;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.WatchlistResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {WatchlistStockMapper.class})
public interface WatchlistResponseMapper {

    @Mapping(source = "name", target = "watchlistName")
    @Mapping(source = "watchlistStockList", target = "watchlistStocks")
    WatchlistResponseDTO toResponseDTO(Watchlist watchlist);


}
