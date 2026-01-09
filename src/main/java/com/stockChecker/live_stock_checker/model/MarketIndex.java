package com.stockChecker.live_stock_checker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(
        name = "index_table",
        indexes = {
                @Index(name = "idx_indexSymbol", columnList = "index_symbol")
        }
)

public class MarketIndex {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long serialId;

    private String indexName;
    private String indexIdentifier;

    @Column(unique = true)
    private String indexSymbol;

    private Integer indexPriority;
}