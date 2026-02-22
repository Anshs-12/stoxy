package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.exceptions.IndexNotFoundException;
import com.stockChecker.live_stock_checker.model.MarketIndex;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexAdvanceDTO;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexMetadataDTO;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexPriceInfoDTO;
import com.stockChecker.live_stock_checker.repository.IndexRepository;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

@Slf4j
@Service
public class IndexCacheService {
    @Autowired
    private IndexRepository indexRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private RestClient restClient;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MarketStatusService marketStatusService;


    // ----------------------------- Index Live Caching -----------------------------
    @Cacheable(
            cacheNames = "indicesLive",
            key = "#indexSymbol.toUpperCase().trim().replace(' ', '_')",
            condition = "#indexSymbol !=null",
            unless = "#result == null"
    )
    public IndexDetailResponseDTO getIndexLive(String indexSymbol) throws JsonProcessingException {
        log.info("Fetching LIVE index data for: {}", indexSymbol);
        return fetchCompleteIndexData(indexSymbol);
    }

    // ----------------------------- Index Weekday Caching -----------------------------
    @Cacheable(
            cacheNames = "indicesWeekDayClosed",
            key = "#indexSymbol.toUpperCase().trim().replace(' ', '_')",
            condition = "#indexSymbol !=null",
            unless = "#result == null"
    )
    public IndexDetailResponseDTO getIndicesWeekdayClosed(String indexSymbol) throws JsonProcessingException {
        log.info("Fetching WEEKDAY CLOSED index data for: {}", indexSymbol);
        return fetchCompleteIndexData(indexSymbol);
    }


    // ----------------------------- Index Weekend Caching -----------------------------
    @Cacheable(
            cacheNames = "indicesWeekendClosed",
            key = "#indexSymbol.toUpperCase().trim().replace(' ', '_')",
            condition = "#indexSymbol !=null",
            unless = "#result == null"
    )
    public IndexDetailResponseDTO getIndicesWeekendClosed(String indexSymbol) throws JsonProcessingException {
        log.info("Fetching WEEKEND CLOSED index data for: {}", indexSymbol);
        return fetchCompleteIndexData(indexSymbol);
    }


    private IndexDetailResponseDTO fetchCompleteIndexData(String indexSymbol) throws JsonProcessingException {
        String indexIdentifier = indexSymbol.toUpperCase().trim().replace(" ", "_");
        log.info("Fetching from DB and API for index: {}", indexSymbol);
        String jsonResponse = fetchIndexDataFromAPI(indexSymbol);
        JsonNode rootNode = objectMapper.readTree(jsonResponse);

        if (rootNode == null || rootNode.isEmpty()) {
            throw new IndexNotFoundException("Index with indexSymbol " + indexSymbol + " does not exist!");
        }


        MarketIndex indexFound = indexRepository.findByIndexIdentifier(indexIdentifier)
                .orElseThrow(() -> new IndexNotFoundException("Index with indexSymbol " + indexSymbol + " does not exist!"));

        IndexMetadataDTO indexMetadataDTO = modelMapper.map(indexFound, IndexMetadataDTO.class);

        // Extracting data node (first element in data array)
        JsonNode dataNode = rootNode.get("data").get(0);
        IndexAdvanceDTO advanceDTO = mapAdvanceData(rootNode.get("advance"));
        IndexPriceInfoDTO priceDTO = mapPriceData(dataNode);

        return IndexDetailResponseDTO.builder()
                .name(rootNode.get("name").asText())
                .time(rootNode.get("timestamp").asText())
                .indexMetadataDTO(indexMetadataDTO)
                .indexAdvanceDTO(advanceDTO)
                .indexPriceInfoDTO(priceDTO)
                .build();
    }


    private String fetchIndexDataFromAPI(String indexSymbol) {
        return restClient.get()
                .uri("/equity-stockIndices?index={indexSymbol}", indexSymbol.toUpperCase())
                .retrieve()
                .body(String.class);
    }

    private IndexAdvanceDTO mapAdvanceData(JsonNode advanceNode) {
        return IndexAdvanceDTO.builder()
                .declines(Integer.parseInt(advanceNode.get("declines").asText()))
                .advances(Integer.parseInt(advanceNode.get("advances").asText()))
                .unChanged(Integer.parseInt(advanceNode.get("unchanged").asText()))
                .build();
    }

    private IndexPriceInfoDTO mapPriceData(JsonNode dataNode) {
        return IndexPriceInfoDTO.builder()
                .indexSymbol(dataNode.get("symbol").asText())
                .ffmc(new BigDecimal(dataNode.get("ffmc").asText()))
                .open(new BigDecimal(dataNode.get("open").asText()))
                .lastPrice(new BigDecimal(dataNode.get("lastPrice").asText()))
                .previousClose(new BigDecimal(dataNode.get("previousClose").asText()))
                .dayHigh(new BigDecimal(dataNode.get("dayHigh").asText()))
                .dayLow(new BigDecimal(dataNode.get("dayLow").asText()))
                .change(new BigDecimal(dataNode.get("change").asText()))
                .pChange(new BigDecimal(dataNode.get("pChange").asText()))
                .yearHigh(new BigDecimal(dataNode.get("yearHigh").asText()))
                .yearLow(new BigDecimal(dataNode.get("yearLow").asText()))
                .totalTradedVolume(new BigDecimal(dataNode.get("totalTradedVolume").asText()))
                .totalTradedValue(new BigDecimal(dataNode.get("totalTradedValue").asText()))
                .nearWKH(new BigDecimal(dataNode.get("nearWKH").asText()))
                .nearWKL(new BigDecimal(dataNode.get("nearWKL").asText()))
                .build();
    }

}
