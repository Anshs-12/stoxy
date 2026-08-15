package com.stoxyfinance.mapper;

import com.stoxyfinance.model.WatchlistStock;
import com.stoxyfinance.payload.WatchlistPayload.WatchlistStockResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WatchlistStockMapper {

    @Mapping(source = "stock.stockName", target = "stockName")
    @Mapping(source = "stock.stockSymbol", target = "stockSymbol")
    @Mapping(source = "stock.upstoxInstrumentKey", target = "instrumentKey")
    WatchlistStockResponseDTO toWatchlistStockResponseDTO(WatchlistStock watchlistStock);
}
