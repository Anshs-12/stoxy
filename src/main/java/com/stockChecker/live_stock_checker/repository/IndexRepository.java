package com.stockChecker.live_stock_checker.repository;

import com.stockChecker.live_stock_checker.model.MarketIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IndexRepository extends JpaRepository<MarketIndex, Long> {
    @Query("SELECT m FROM MarketIndex m WHERE " +
            "LOWER(m.indexName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(m.indexSymbol) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(m.segment) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(m.exchange) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<MarketIndex> searchIndices(@Param("query") String query);

    Optional<MarketIndex> findByUpstoxInstrumentKey(String instrumentKey);

    List<MarketIndex> findTop15ByOrderByIndexPriorityAsc();
}
