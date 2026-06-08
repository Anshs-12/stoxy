package com.stockChecker.live_stock_checker.mapper;

import com.stockChecker.live_stock_checker.model.MarketIndex;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexSearchDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IndexSearchMapper {

    @Mapping(source = "upstoxInstrumentKey", target = "instrumentKey")
    List<IndexSearchDTO> toIndexSearchDTO(List<MarketIndex> marketIndexList);

}
