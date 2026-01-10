package com.stockChecker.live_stock_checker.payload.StockPayload;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class CompanyResponseDTO {
    private String companyName;
    private String aboutCompany;
    private String isIN;
    private String subIndustry;
    private String industry;
    private String sector;
    private String listingDate;
}
