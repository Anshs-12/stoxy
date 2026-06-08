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
@Table(
        name = "index_table",
        indexes = {
                @Index(name = "idx_indexSymbol", columnList = "index_symbol"),
                @Index(name = "idx_upstoxInstrumentKey", columnList = "upstox_instrument_key")
        }
)

public class MarketIndex {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long serialId;

    private String indexName;
    @Column(unique = true)
    private String indexSymbol;
    private Integer indexPriority;
    private String segment;
    private String exchange;
    private String upstoxInstrumentKey;
    // metadata of an Index. (added manually for now till, we find any API)
    private Integer numberOfConstituents;
    private String launchDate;
    private String baseDate;
    private String methodology;
    private String description;
    private Boolean isActive;

}