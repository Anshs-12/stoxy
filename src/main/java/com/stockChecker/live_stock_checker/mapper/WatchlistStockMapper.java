package com.stockChecker.live_stock_checker.mapper;

import com.stockChecker.live_stock_checker.model.WatchlistStock;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.WatchlistStockResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WatchlistStockMapper {

    @Mapping(source = "stock.stockName", target = "stockName")
    @Mapping(source = "stock.stockSymbol", target = "stockSymbol")
    @Mapping(source = "stock.upstoxInstrumentKey", target = "instrumentKey")
    WatchlistStockResponseDTO toWatchlistStockResponseDTO(WatchlistStock watchlistStock);
}
