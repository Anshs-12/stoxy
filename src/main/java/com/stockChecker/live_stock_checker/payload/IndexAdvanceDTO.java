package com.stockChecker.live_stock_checker.payload;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class IndexAdvanceDTO {
    private Integer declines;
    private Integer advances;
    private Integer unChanged;
}
