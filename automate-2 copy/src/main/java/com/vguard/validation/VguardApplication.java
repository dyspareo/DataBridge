package com.vguard.validation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.vguard.validation", "com.vguard.validation.fab"})
public class VguardApplication {
    public static void main(String[] args) {
        SpringApplication.run(VguardApplication.class, args);
    }
}
