package com.stockChecker.live_stock_checker.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexDetailResponseDTO;
import com.stockChecker.live_stock_checker.service.IndexService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/index")
public class IndexController {

    @Autowired
    private IndexService indexService;

    // get entire Index Response by indexSymbol
    @GetMapping("/search/{indexSymbol}")
    public ResponseEntity<IndexDetailResponseDTO> getIndexBySymbol(@PathVariable String indexSymbol) throws JsonProcessingException {
        IndexDetailResponseDTO indexDetailResponseDTO = indexService.getIndexBySymbol(indexSymbol);
        return new ResponseEntity<>(indexDetailResponseDTO, HttpStatus.OK);
    }

}
