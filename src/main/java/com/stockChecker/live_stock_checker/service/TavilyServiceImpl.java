package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.*;

@Service
@Slf4j
public class TavilyServiceImpl implements TavilyService {

    private RestClient tavilyRestClient;
    private ObjectMapper objectMapper;


    public TavilyServiceImpl(@Qualifier("tavilyRestClient") RestClient tavilyRestClient, ObjectMapper objectMapper) {
        this.tavilyRestClient = tavilyRestClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<Document> getTavilySearchResults(String stockName, String query) {
        try {
            // calling Tavily endpoint.
            log.info("Fetching Tavily API response for query: {}", query);
            String response = getTavilySearchData(query);
            if (response == null) {
                log.error("No response from Tavily API for query: {}", query);
                return List.of();
            }
            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode resultsNode = rootNode.path("results");
            if (resultsNode.isMissingNode() || !resultsNode.isArray()) {
                log.error("Invalid response structure from Tavily API for query: {}", query);
                return List.of();
            }
            // creating the document list : parsing TavilyResponse to SpringAI Document
            log.info("Processing Tavily API response for query: {}", query);
            List<Document> tavilyDocumentResponse = new ArrayList<>();
            for (var eachResult : resultsNode) {
                if (eachResult.path("score").asDouble() >= 0.5) {
                    String url = eachResult.path("url").asText();
                    String source = new java.net.URI(url).getHost(); // e.g. "economictimes.indiatimes.com"
                    Map<String, Object> metadataMap = Map.of(
                            "url", url,
                            "title", eachResult.path("title").asText(),
                            "ticker", stockName,
                            "source", source,
                            "score", eachResult.path("score").asDouble(),
                            "timestamp", Instant.now().toString()
                    );
                    Document document = Document.builder()
                            .text(eachResult.path("content").asText())
                            .id(UUID.nameUUIDFromBytes(url.getBytes()).toString())
                            .metadata(metadataMap)
                            .build();
                    tavilyDocumentResponse.add(document);
                }
            }
            log.info("Tavily API response processed successfully for query: {}. Total documents: {}",
                    query, tavilyDocumentResponse.size());
            return tavilyDocumentResponse;
        } catch (Exception e) {
            log.error("Error processing Tavily API response: {}", e.getMessage());
            return List.of();
        }
    }

    public String getTavilySearchData(String query) {
        try {
            log.info("Calling Tavily API for query: {}", query);
            return tavilyRestClient.post()
                    .body(getTavilyRequestBody(query))
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("Error fetching data from Tavily API: {}", e.getMessage());
            return null;
        }
    }

    public Map<String, Object> getTavilyRequestBody(String query) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("query", query);
        requestBody.put("topic", "finance");
        requestBody.put("time_range", "week");
        requestBody.put("search_depth", "advanced");
        requestBody.put("max_results", 5);
        requestBody.put("include_domains", getIncludeDomainLists());
        return requestBody;
    }

    public List<String> getIncludeDomainLists() {
        return List.of(
                "economictimes.indiatimes.com",
                "livemint.com",
                "business-standard.com",
                "thehindubusinessline.com",
                "ndtvprofit.com",
                "cnbctv18.com",
                "financialexpress.com",
                "finshots.in",
                "moneycontrol.com",
                "businesstoday.in",
                "forbesindia.com",
                "businessinsider.in",
                "theken.io",
                "rbi.org.in",
                "sebi.gov.in"
        );
    }
}
