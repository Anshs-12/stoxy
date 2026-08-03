package com.stockChecker.live_stock_checker.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@Primary
public class JinaEmbeddingModel implements EmbeddingModel {


    private RestClient jinaEmbeddingRestClient;
    private ObjectMapper objectMapper;
    public Long totalTokens = 0L;

    public JinaEmbeddingModel(@Qualifier("jinaEmbeddingRestClient") RestClient jinaEmbeddingRestClient, ObjectMapper objectMapper) {
        this.jinaEmbeddingRestClient = jinaEmbeddingRestClient;
        this.objectMapper = objectMapper;
    }

    @Override
    @SuppressWarnings("unchecked")
    public EmbeddingResponse call(EmbeddingRequest request) {
        List<String> texts = request.getInstructions();
        Map<String, Object> body = Map.of(
                "model", "jina-embeddings-v3",
                "task", "retrieval.passage",
                "dimensions", 1024,
                "input", texts
        );
        Map<String, Object> response = jinaEmbeddingRestClient.post()
                .body(body)
                .retrieve()
                .body(Map.class);


        JsonNode jsonResponse = objectMapper.valueToTree(response);
        JsonNode dataNode = jsonResponse.path("data");
        log.info("Total tokens used for embedding: {}", jsonResponse.path("usage").path("total_tokens"));
        List<Embedding> embeddings = new ArrayList<>();
        int index = 0;
        for (JsonNode eachEmbeddingNode : dataNode) {
            JsonNode eachEmbedding = eachEmbeddingNode.path("embedding");
            float[] embeddingArray = new float[1024];
            int j = 0;
            for (var x : eachEmbedding) {
                embeddingArray[j] = (float) x.asDouble();
                j++;
            }
            embeddings.add(new Embedding(embeddingArray, index));
            index++;
        }
        return new EmbeddingResponse(embeddings);
    }

    @Override
    public float[] embed(Document document) {
        EmbeddingRequest request = new EmbeddingRequest(List.of(document.getText()), null);
        EmbeddingResponse response = call(request);
        return response.getResult().getOutput();
    }

    @Override
    public int dimensions() {
        return 1024;
    }
}
