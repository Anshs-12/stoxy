package com.stoxyfinance.mapper;

import com.stoxyfinance.model.MarketIndex;
import com.stoxyfinance.payload.IndexPayload.IndexSearchDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IndexSearchMapper {

    @Mapping(source = "upstoxInstrumentKey", target = "instrumentKey")
    List<IndexSearchDTO> toIndexSearchDTO(List<MarketIndex> marketIndexList);

    @Mapping(source = "upstoxInstrumentKey", target = "instrumentKey")
    IndexSearchDTO toIndexSearchDTO(MarketIndex marketIndex);
}
