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
import com.stockChecker.live_stock_checker.payload.MarketStatusResponse;
import com.stockChecker.live_stock_checker.repository.IndexRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;

@Service
public class IndexServiceImpl implements IndexService {

    @Autowired
    private IndexRepository indexRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private WebClient webClient;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MarketStatusService marketStatusService;

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

    @Autowired
    private IndexService self;
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

        if (response.getIsOpen()) {
            return self.getIndexLive(indexSymbol);
        }
        if (response.getNextOpeningDay().equals("MONDAY")) {
            return self.getIndicesWeekendClosed(indexSymbol);
        }
        return self.getIndicesWeekdayClosed(indexSymbol);
    }

    @Cacheable(
            cacheNames = "indicesLive",
            key = "#indexSymbol.toUpperCase().trim().replace(' ', '_')",
            condition = "#indexSymbol !=null",
            unless = "#result == null"
    )
    public IndexDetailResponseDTO getIndexLive(String indexSymbol) throws JsonProcessingException {
        System.out.println("===================================IndexLive METHOD IS BEING CALLED===================================");
        return fetchCompleteIndexData(indexSymbol);
    }

    @Cacheable(
            cacheNames = "indicesWeekDayClosed",
            key = "#indexSymbol.toUpperCase().trim().replace(' ', '_')",
            condition = "#indexSymbol !=null",
            unless = "#result == null"
    )
    public IndexDetailResponseDTO getIndicesWeekdayClosed(String indexSymbol) throws JsonProcessingException {
        System.out.println("===================================Weekday METHOD IS BEING CALLED===================================");
        return fetchCompleteIndexData(indexSymbol);
    }

    @Cacheable(
            cacheNames = "indicesWeekendClosed",
            key = "#indexSymbol.toUpperCase().trim().replace(' ', '_')",
            condition = "#indexSymbol !=null",
            unless = "#result == null"
    )
    public IndexDetailResponseDTO getIndicesWeekendClosed(String indexSymbol) throws JsonProcessingException {
        System.out.println("===================================weekend METHOD IS BEING CALLED===================================");

        return fetchCompleteIndexData(indexSymbol);
    }


    private IndexDetailResponseDTO fetchCompleteIndexData(String indexSymbol) throws JsonProcessingException {
        String indexIdentifier = indexSymbol.toUpperCase().trim().replace(" ", "_");
        System.out.println("===== METHOD EXECUTING - FETCHING FROM DB AND API =====");
        String jsonResponse = fetchIndexData(indexSymbol);
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


    private String fetchIndexData(String indexSymbol) {
        return webClient.get()
                .uri("/equity-stockIndices?index=" + indexSymbol.toUpperCase())
                .retrieve()
                .bodyToMono(String.class)
                .block();
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
