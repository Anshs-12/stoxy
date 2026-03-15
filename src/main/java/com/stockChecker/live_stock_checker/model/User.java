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
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "userId", unique = true, nullable = false)
    private Long userId;

    @Column(name = "name", unique = false, nullable = false)
    private String name;

    @Column(name = "userMailId", unique = true, nullable = false)
    private String userMailId;

    @Column(name = "authProvider", nullable = false)
    @Enumerated(EnumType.STRING)
    private OAuth2Provider authProvider;

    // here a watchlist object isn't required as we can directly get the watchlists associated
    // with this user by doing watchlistRepository.findByUser(userObject);
}
