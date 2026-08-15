package com.stoxyfinance.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
@Slf4j
public class NewsAnalysisServiceImpl implements NewsAnalysisService {

    private final VectorStore vectorStore;
    private final TavilyService tavilyService;

    @Override
    public String getStockNews(String stockName) {
        String qdrantQuery = String.format("%s stock news", stockName);
        String tavilyQuery = String.format("%s company news announcement today", stockName);
        return getNews(stockName, qdrantQuery, tavilyQuery);
    }

    @Override
    public String getMarketIndexNews(String marketIndexName) {
        String qdrantQuery = String.format("%s market news", marketIndexName);
        String tavilyQuery = String.format("%s market index latest news", marketIndexName);
        return getNews(marketIndexName, qdrantQuery, tavilyQuery);
    }

    private String getNews(String stockName, String qdrantQuery, String tavilyQuery) {
        List<Document> qdrantResponses = fetchQdrantDB(qdrantQuery, stockName);
        boolean usedTavily = false;
        if (qdrantResponses.size() < 3) {
            // call tavily endpoint, filling in the Qdrant VectorDB and get the results again.
            List<Document> tavilyResponses = tavilyService.getTavilySearchResults(stockName, tavilyQuery);
            if (!tavilyResponses.isEmpty()) {
                usedTavily = true;
                // adding to Qdrant VectorDB
                try {
                    vectorStore.add(tavilyResponses);
                    qdrantResponses = fetchQdrantDB(qdrantQuery, stockName);
                } catch (Exception e) {
                    log.error("Error adding documents to Qdrant DB for query: {}", qdrantQuery, e);
                }
            }
        }

        if (qdrantResponses.isEmpty()) {
            log.warn("No news found for stock: {} after Tavily fallback.", stockName);
            return "No recent news available for " + stockName + ".";
        }
        log.info("Resolved {} news documents for {} (tavily fallback: {})", qdrantResponses.size(), stockName, usedTavily);
        StringBuilder sb = new StringBuilder();
        for (Document doc : qdrantResponses) {
            sb.append(doc.getText()).append("\n\n---\n\n");
        }
        return sb.toString();
    }

    private List<Document> fetchQdrantDB(String query, String stockName) {
        try {
            FilterExpressionBuilder b = new FilterExpressionBuilder();
            return vectorStore.similaritySearch(SearchRequest.builder()
                    .query(query)
                    .topK(8)
                    .filterExpression(b.eq("ticker", stockName).build())
                    .build());
//                    .similarityThreshold(0.6)
        } catch (Exception e) {
            log.error("Error occurred while fetching from Qdrant DB", e);
            return List.of();
        }
    }
}
