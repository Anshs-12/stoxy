package com.stoxyfinance.mapper;

import com.stoxyfinance.model.MarketIndex;
import com.stoxyfinance.payload.IndexPayload.IndexMetadataDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface IndexMetadataMapper {

    IndexMetadataDTO toIndexMetadataDTO(MarketIndex marketIndex);
}
