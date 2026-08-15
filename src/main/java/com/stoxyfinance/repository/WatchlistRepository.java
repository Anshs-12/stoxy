package com.stoxyfinance.repository;

import com.stoxyfinance.model.User;
import com.stoxyfinance.model.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {
    boolean existsByName(String watchlistName);

    boolean existsByNameAndUser(String watchlistName, User loggedInUser);

    List<Watchlist> findByUser(User loggedInUser);

    Optional<Watchlist> findByIdAndUser_UserMailId(Long watchlistId, String userEmail);
}
