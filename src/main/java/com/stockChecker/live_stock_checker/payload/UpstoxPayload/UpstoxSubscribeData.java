package com.stockChecker.live_stock_checker.payload.UpstoxPayload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class UpstoxSubscribeData {
    String mode;
    List<String> instrumentKeys;
}
