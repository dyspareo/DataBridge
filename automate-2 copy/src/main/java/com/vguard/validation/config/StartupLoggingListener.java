package com.vguard.validation.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Slf4j
@Component
public class StartupLoggingListener {

    @Value("${server.port:8080}")
    private String port;

    private final Environment environment;

    public StartupLoggingListener(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        String[] profiles = environment.getActiveProfiles();
        String env = profiles.length == 0 ? "default" : Arrays.toString(profiles);
        log.info("[EAH] Application started successfully | port: {} | env: {}", port, env);
    }
}
