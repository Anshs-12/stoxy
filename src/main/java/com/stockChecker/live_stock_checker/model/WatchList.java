package com.stockChecker.live_stock_checker.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "watchlist_table")
public class WatchList {

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    @NotBlank
    @Column(nullable = false)
    private String name;

    private LocalDateTime createdAt;

    @ManyToOne
    private User user;

    @OneToMany(mappedBy = "watchList")
    private List<WatchListStock> watchListStockList;

}


/*
    @NotNull → Application validation
    @Column(nullable = false) → Creates NOT NULL constraint in the database.
    @NotBlank → Ensures a String field is not null, not empty, and not only whitespace.
*/