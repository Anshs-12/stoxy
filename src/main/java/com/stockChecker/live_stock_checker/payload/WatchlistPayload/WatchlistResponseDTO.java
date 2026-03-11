package com.stockChecker.live_stock_checker.payload.WatchlistPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class WatchlistResponseDTO {
    String watchlistName;
    List<WatchlistStockResponseDTO> watchlistStockDTO;
    LocalDateTime createdAt;

}
