package com.stoxyfinance.mapper;

import com.stoxyfinance.model.Watchlist;
import com.stoxyfinance.payload.WatchlistPayload.WatchlistResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {WatchlistStockMapper.class})
public interface WatchlistResponseMapper {

    @Mapping(source = "name", target = "watchlistName")
    @Mapping(source = "watchlistStockList", target = "watchlistStocks")
    WatchlistResponseDTO toResponseDTO(Watchlist watchlist);
}
