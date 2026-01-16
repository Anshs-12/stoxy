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
                @Index(name = "idx_indexIdentifier", columnList = "index_identifier")
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

    // metadata of an Index. (added manually for now till, we find any API)
    private Integer numberOfConstituents;
    private String launchDate;
    private String baseDate;
    private String methodology;
    private String description;
    private Boolean isActive;

}