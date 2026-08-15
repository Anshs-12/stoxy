package com.stoxyfinance.service.index;

import com.stoxyfinance.payload.IndexPayload.IndexDetailResponseDTO;
import com.stoxyfinance.payload.IndexPayload.IndexSearchResponseDTO;

import java.util.List;


public interface IndexService {

    IndexDetailResponseDTO getIndexByInstrumentKey(String instrumentKey);

    IndexSearchResponseDTO searchIndices(String query);

    List<String> getMarqueeIndices();
}