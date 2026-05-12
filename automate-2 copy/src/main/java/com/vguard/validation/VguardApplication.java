package com.vguard.validation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.vguard.validation", "com.vguard.validation.fab"})
@Slf4j
public class VguardApplication {
    public static void main(String[] args) {
        log.info("[EAH] Bootstrapping application context");
        SpringApplication.run(VguardApplication.class, args);
    }
}
