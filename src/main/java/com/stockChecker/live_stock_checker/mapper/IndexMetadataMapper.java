package com.stockChecker.live_stock_checker.mapper;

import com.stockChecker.live_stock_checker.model.MarketIndex;
import com.stockChecker.live_stock_checker.payload.IndexPayload.IndexMetadataDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface IndexMetadataMapper {

    IndexMetadataDTO toIndexMetadataDTO(MarketIndex marketIndex);
}
