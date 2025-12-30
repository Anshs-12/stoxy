package com.stockChecker.live_stock_checker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer serialNumber;
    private String companyName;
    private String aboutCompany;
    private String sector;
    private String industry;
    private Integer foundedYear;

    @OneToOne(mappedBy = "company", cascade = CascadeType.ALL)
    private Stock stock;
}
