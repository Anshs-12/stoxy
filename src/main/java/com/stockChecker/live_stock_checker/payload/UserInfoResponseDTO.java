package com.stockChecker.live_stock_checker.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserInfoResponseDTO {

    private String userName;
    private String userEmailId;
    private String jwtToken;
    private String providerType;

}
