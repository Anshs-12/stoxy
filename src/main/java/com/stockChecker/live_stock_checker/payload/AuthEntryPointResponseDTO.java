package com.stockChecker.live_stock_checker.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthEntryPointResponseDTO {
    Integer status;
    String message;
    String error;
    String path;
}
