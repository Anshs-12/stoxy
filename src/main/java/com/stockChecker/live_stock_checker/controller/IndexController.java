package com.stockChecker.live_stock_checker.controller;

import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexSearchResponseDTO;
import com.stockChecker.live_stock_checker.service.IndexService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/index")
@Slf4j
@RequiredArgsConstructor
public class IndexController {

    private final IndexService indexService;

    // get entire Index Response by indexSymbol
    @GetMapping("/search/{indexSymbol}")
    public ResponseEntity<IndexDetailResponseDTO> getIndexBySymbol(@PathVariable String indexSymbol) {
        log.info("Index request - symbol: {}", indexSymbol);
        IndexDetailResponseDTO indexDetailResponseDTO = indexService.getIndexBySymbol(indexSymbol);
        return new ResponseEntity<>(indexDetailResponseDTO, HttpStatus.OK);
    }

    // this endpoint searches all parameters like segment, exchange, name, symbol...
    @GetMapping("/search")
    public ResponseEntity<IndexSearchResponseDTO> searchIndices(@RequestParam String query) {
        log.info("Index search request - query: {}", query);
        IndexSearchResponseDTO indexSearchResponseDTOList = indexService.searchIndices(query);
        return new ResponseEntity<>(indexSearchResponseDTOList, HttpStatus.OK);
    }

}
