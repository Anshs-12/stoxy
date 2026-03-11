package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.User;
import com.stockChecker.live_stock_checker.model.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {
    boolean existsByName(String watchlistName);

    boolean existsByNameAndUser(String watchlistName, User loggedInUser);
}
