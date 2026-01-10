package com.stockChecker.live_stock_checker.payload.IndexPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class IndexDetailResponseDTO {

    // Live data from NSE API
    private String name;
    private String time;
    private IndexMetadataDTO indexMetadataDTO;
    private IndexAdvanceDTO indexAdvanceDTO;
    private IndexPriceInfoDTO indexPriceInfoDTO;

    // Metadata from your database

}