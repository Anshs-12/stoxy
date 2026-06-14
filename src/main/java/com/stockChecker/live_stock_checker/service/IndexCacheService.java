package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.exceptions.ResourceNotFoundException;
import com.stockChecker.live_stock_checker.mapper.IndexMetadataMapper;
import com.stockChecker.live_stock_checker.model.MarketIndex;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexMetadataDTO;
import com.stockChecker.live_stock_checker.repository.IndexRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class IndexCacheService {

    private final IndexRepository indexRepository;
    private final IndexMetadataMapper indexMetadataMapper;


    // ----------------------------- Index Live Caching -----------------------------
    @Cacheable(
            cacheNames = "indicesLive",
            key = "#indexSymbol",
            condition = "#indexSymbol !=null",
            unless = "#result == null"
    )
    public IndexDetailResponseDTO getIndexLive(String indexSymbol) {
        log.info("Fetching LIVE index data for: {}", indexSymbol);
        return fetchCompleteIndexData(indexSymbol);
    }

    // ----------------------------- Index Weekday Caching -----------------------------
    @Cacheable(
            cacheNames = "indicesWeekDayClosed",
            key = "#indexSymbol",
            condition = "#indexSymbol !=null",
            unless = "#result == null"
    )
    public IndexDetailResponseDTO getIndicesWeekdayClosed(String indexSymbol) {
        log.info("Fetching WEEKDAY CLOSED index data for: {}", indexSymbol);
        return fetchCompleteIndexData(indexSymbol);
    }


    // ----------------------------- Index Weekend Caching -----------------------------
    @Cacheable(
            cacheNames = "indicesWeekendClosed",
            key = "#indexSymbol",
            condition = "#indexSymbol !=null",
            unless = "#result == null"
    )
    public IndexDetailResponseDTO getIndicesWeekendClosed(String indexSymbol) {
        log.info("Fetching WEEKEND CLOSED index data for: {}", indexSymbol);
        return fetchCompleteIndexData(indexSymbol);
    }


    private IndexDetailResponseDTO fetchCompleteIndexData(String indexSymbol) {
        log.info("Fetching from DB and API for index: {}", indexSymbol);
        MarketIndex indexFetched = indexRepository.findByIndexSymbol(indexSymbol)
                .orElseThrow(() -> new ResourceNotFoundException("Index not found!"));

        IndexMetadataDTO indexMetadataDTO = indexMetadataMapper.toIndexMetadataDTO(indexFetched);

        return IndexDetailResponseDTO.builder()
                .indexName(indexFetched.getIndexName())
                .indexSymbol(indexSymbol)
                .indexMetadataDTO(indexMetadataDTO)
                .indexAdvanceDTO(null)
                .indexPriceInfoDTO(null)
                .build();
    }
}
