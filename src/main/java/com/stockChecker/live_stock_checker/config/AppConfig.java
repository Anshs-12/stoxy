package com.stockChecker.live_stock_checker.config;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.client.RestClient;

@Configuration
public class AppConfig {

    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }

    @Bean
    public RestClient restClient(@Value("${upstox_analytics_token}") String token) {
        return RestClient.builder()
                .baseUrl("https://api.upstox.com/")
                .defaultHeader(HttpHeaders.CONTENT_TYPE,
                        MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT,
                        MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("Authorization", "Bearer " + token)
                .build();
    }

    @Bean
    public TaskScheduler taskScheduler() {
        return new ThreadPoolTaskScheduler();
    }

    /*
        Here, we need to add default headers when sending a request so that the request doesn't get blocked.

        When fetching data from API's, bots are automatically blocked, so by this header:
            1. HttpHeaders.USER_AGENT - This tells the api endpoint that the request is coming from a browser and not just bots
                normally api requests are allowed when requested from a browser otherwise they are blocked.
                So we create a request each time telling that this is coming from a browser.

                A brief story:
                    When an api request is made, it is then checked that if it's coming from the browser or a HttpClient
                    like Postman/Httpie so on.
                    So then the requests are allowed otherwise bots can destroy the endpoint by too many requests or other things,
                    this way in our backend we add in the header responsible to tell where the request is coming from, and is done
                    by this USER_AGENT, in the values we add that this is coming from a browser and not from some bots.

                    In a client like Postman, it already adds it's headers if you open the request Header's tab and see the
                    hidden headers.

            2. HttpHeaders.REFERER - When request from a plain backend our request would be automatically be blocked,so we
                fake it by telling that this request is coming from "https://www.nseindia.com/" so that the request is allowed.
                This is done so that our backend can still request making the api think that the request is coming from
                an actual website.

            3. HttpHeaders.ACCEPT - This basically tells that we want the content to be in json format which we specify
                by mentioning  MediaType.APPLICATION_JSON_VALUE.

            4. HttpHeaders.CONTENT_TYPE - This header is used mostly in POST request.
                It tells that the content,we are sending is in JSON Format.(MediaType.APPLICATION_JSON_VALUE)
                * usually has no role in GET requests as we don't send any content whatsoever.

    */
}
