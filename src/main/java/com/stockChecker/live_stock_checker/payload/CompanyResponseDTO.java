package com.stockChecker.live_stock_checker.payload;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class CompanyResponseDTO {
    private String companyName;
    private String aboutCompany;
    private String sector;
    private String industry;
    private Integer foundedYear;
}
