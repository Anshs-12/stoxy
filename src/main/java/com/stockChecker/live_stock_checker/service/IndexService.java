package com.stockChecker.live_stock_checker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexDetailResponseDTO;


public interface IndexService {

    IndexDetailResponseDTO getIndexBySymbol(String indexSymbol) throws JsonProcessingException;

    IndexDetailResponseDTO getIndexLive(String indexSymbol) throws JsonProcessingException;

    IndexDetailResponseDTO getIndicesWeekendClosed(String indexSymbol) throws JsonProcessingException;

    IndexDetailResponseDTO getIndicesWeekdayClosed(String indexSymbol) throws JsonProcessingException;
}
