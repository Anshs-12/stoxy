package com.stockChecker.live_stock_checker.payload.IndexPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class IndexSearchResponseDTO {
    private List<IndexSearchDTO> indexSearchDTOList;
}
