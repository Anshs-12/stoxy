package com.stockChecker.live_stock_checker.payload.UpstoxPayload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpstoxSubscribeRequest {

    String guid;
    String method;
    UpstoxSubscribeData data;
}
