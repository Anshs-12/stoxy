package com.stockChecker.live_stock_checker.service;

import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexDetailResponseDTO;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexSearchResponseDTO;

import java.util.List;


public interface IndexService {

    IndexDetailResponseDTO getIndexByInstrumentKey(String instrumentKey);

    IndexSearchResponseDTO searchIndices(String query);

    List<String> getMarqueeIndices();
}