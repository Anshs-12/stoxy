package com.stockChecker.live_stock_checker.mapper;

import com.stockChecker.live_stock_checker.model.Watchlist;
import com.stockChecker.live_stock_checker.payload.WatchlistPayload.WatchlistSummaryDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface WatchlistSummaryMapper {

    @Mapping(source = "name", target = "watchlistName")
    @Mapping(source = "id", target = "watchlistId")
    WatchlistSummaryDTO toSummaryDTO(Watchlist watchlist);

    List<WatchlistSummaryDTO> toSummaryDTOList(List<Watchlist> watchlists);
}

// so basically here toSummaryDTOList would work this way under the hood
/*  public List<WatchlistSummaryDTO> toSummaryDTOList(List<Watchlist> watchlists) {
        return watchlists.stream()
            .map(watchlist -> toSummaryDTO(watchlist)) // calls YOUR defined method
            .toList();
    }

    Here, toSummaryDTOList finds the toSummaryDTO by seeing the return type and
    the arguments passed and therefore works by default!

 */