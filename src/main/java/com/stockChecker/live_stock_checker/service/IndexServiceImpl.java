package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockChecker.live_stock_checker.mapper.IndexSearchMapper;
import com.stockChecker.live_stock_checker.model.MarketIndex;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexSearchDTO;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexSearchResponseDTO;
import com.stockChecker.live_stock_checker.payload.MarketStatusResponse;
import com.stockChecker.live_stock_checker.repository.IndexRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class IndexServiceImpl implements IndexService {

    private final IndexRepository indexRepository;

    private final ModelMapper modelMapper;

    private final RestClient restClient;

    private final ObjectMapper objectMapper;

    private final MarketStatusService marketStatusService;
    private final IndexCacheService indexCacheService;

    private final IndexSearchMapper indexSearchMapper;
    /*

        SELF-INJECTION PATTERN FOR AOP PROXY ACCESS

        Why we inject IndexService into itself:

        Problem:
        - When a method in this class calls another method in the SAME class (internal call),
          Spring's AOP proxy is bypassed
        - @Cacheable annotations don't work on internal method calls
        - Example: getIndexBySymbol() calls getIndexLive() directly → cache ignored

        Solution:
        - Inject the service into itself as 'self'
        - Call methods through 'self' instead of 'this'
        - self.getIndexLive() goes through Spring proxy → cache works

        Trade-offs:
        - Creates circular dependency (requires spring.main.allow-circular-references=true)
        - Not ideal design, but acceptable for AOP patterns
        - Alternative would be splitting into separate services (unnecessary complexity)
    */

    /*
        Note:
            Top 25 indices from NSE have been added in the database, which was done manually
            by me, and it took around 2 hours, to write SQL with help of AI and get all the details
            from official documents & api.

            For values like launchDate,basePrice,baseData,methodology and numberOfConstituents the data
            was extract from the FactSheet of each Index.

            isActive is true for all the indices.
    */

//    public ResponseEntity<IndexDetailResponseDTO> getAllIndices() throws JsonProcessingException {
//        String jsonResponse = webClient.get()
//                .uri("/allIndices")
//                .retrieve()
//                .bodyToMono(String.class)
//                .block();
//
//        JsonNode rootNode = objectMapper.readTree(jsonResponse);
//    }

    @Override
    public IndexDetailResponseDTO getIndexBySymbol(String indexSymbol) throws JsonProcessingException {
        MarketStatusResponse response = marketStatusService.isMarketOpen();
        log.info("Fetching index - symbol: {}, marketOpen: {}", indexSymbol, response.getIsOpen());
        if (response.getIsOpen()) {
            return indexCacheService.getIndexLive(indexSymbol);
        }
        if (response.getNextOpeningDay().equals("MONDAY")) {
            return indexCacheService.getIndicesWeekendClosed(indexSymbol);
        }
        return indexCacheService.getIndicesWeekdayClosed(indexSymbol);
    }

    @Override
    public IndexSearchResponseDTO searchIndices(String query) {
        List<MarketIndex> marketIndices = indexRepository.searchIndices(query);

        if (marketIndices.isEmpty()) {
            return IndexSearchResponseDTO.builder()
                    .indexSearchDTOList(List.of())
                    .build();
        }
        List<IndexSearchDTO> indexSearchDTOList = indexSearchMapper.toIndexSearchDTO(marketIndices);
        return IndexSearchResponseDTO.builder()
                .indexSearchDTOList(indexSearchDTOList)
                .build();
    }

    // right now manually feeding indices until we find w working api
//    public MarketIndex saveIndexInDB(String indexSymbol, JsonNode rootNode) {
//        JsonNode dataNode = rootNode.get("data");
//        MarketIndex marketIndex = MarketIndex.builder()
//                .indexName(rootNode.get("name").asText())
//                .indexSymbol(dataNode.get("symbol").asText())
//                .indexIdentifier(dataNode.get("identifier").asText())
//                .indexPriority(dataNode.get("priority").asInt())
//                .build();
//        indexRepository.save(marketIndex);
//        return marketIndex;
//    }
}
