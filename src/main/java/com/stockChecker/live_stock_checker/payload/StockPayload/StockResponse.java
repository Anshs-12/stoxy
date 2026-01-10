package com.stockChecker.live_stock_checker.payload.StockPayload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class StockResponse {

    // this is used to send as a response when user search's on search
    private List<StockSearchResponseDTO> content;
    private Integer pageNumber;
    private Integer pageSize;
    private Long totalElements;
    private Integer totalPages;
    private boolean isFirst;
    private boolean isLast;
}


