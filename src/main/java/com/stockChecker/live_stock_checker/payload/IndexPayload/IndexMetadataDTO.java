package com.stockChecker.live_stock_checker.payload.IndexPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class IndexMetadataDTO {

    private String indexIdentifier;
    private Integer indexPriority;
    private Integer numberOfConstituents;
    private String launchDate;
    private String baseDate;
    private String methodology;
    private String description;
    private Boolean isActive;
}
