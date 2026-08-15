package com.stoxyfinance.service.index;

import com.stoxyfinance.exceptions.ResourceNotFoundException;
import com.stoxyfinance.mapper.IndexMetadataMapper;
import com.stoxyfinance.model.MarketIndex;
import com.stoxyfinance.payload.IndexPayload.IndexDetailResponseDTO;
import com.stoxyfinance.payload.IndexPayload.IndexMetadataDTO;
import com.stoxyfinance.repository.IndexRepository;
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


    private IndexDetailResponseDTO fetchCompleteIndexData(String instrumentKey) {
        log.info("Fetching from DB and API for index: {}", instrumentKey);
        MarketIndex indexFetched = indexRepository.findByUpstoxInstrumentKey(instrumentKey)
                .orElseThrow(() -> new ResourceNotFoundException("Index not found!"));

        IndexMetadataDTO indexMetadataDTO = indexMetadataMapper.toIndexMetadataDTO(indexFetched);

        return IndexDetailResponseDTO.builder()
                .indexName(indexFetched.getIndexName())
                .indexSymbol(indexFetched.getIndexSymbol())
                .instrumentKey(indexFetched.getUpstoxInstrumentKey())
                .indexMetadataDTO(indexMetadataDTO)
                .indexAdvanceDTO(null)
                .indexPriceInfoDTO(null)
                .build();
    }
}