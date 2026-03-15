package com.stockChecker.live_stock_checker.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.repository.cdi.Eager;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "watchlist_table")
public class Watchlist {

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    @NotBlank
    @Column(nullable = false)
    private String name;

    private LocalDateTime createdAt;

    @ManyToOne
    private User user;

    @OneToMany(mappedBy = "watchList",cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WatchlistStock> watchlistStockList;

}


/*
    @NotNull → Application validation
    @Column(nullable = false) → Creates NOT NULL constraint in the database.
    @NotBlank → Ensures a String field is not null, not empty, and not only whitespace.
*/