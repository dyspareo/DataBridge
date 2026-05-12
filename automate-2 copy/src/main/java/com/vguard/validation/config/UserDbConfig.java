package com.vguard.validation.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
@Slf4j
public class UserDbConfig {

    @Bean(name = "userDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.userdb")
    public DataSource userDataSource() {
        log.info("[Config] {} configuration loaded", "UserDbConfig.userDataSource");
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "userJdbcTemplate")
    public JdbcTemplate userJdbcTemplate(@Qualifier("userDataSource") DataSource dataSource) {
        log.info("[Config] {} configuration loaded", "UserDbConfig.userJdbcTemplate");
        return new JdbcTemplate(dataSource);
    }
}
