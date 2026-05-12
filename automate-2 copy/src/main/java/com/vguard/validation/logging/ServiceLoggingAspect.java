package com.vguard.validation.logging;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Slf4j
@Aspect
@Component
public class ServiceLoggingAspect {

    @Around("execution(public * com.vguard.validation..service..*(..))")
    public Object logServiceCalls(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String inputSummary = Arrays.toString(joinPoint.getArgs());

        log.debug("[{}] {}() started | input: {}", className, methodName, inputSummary);
        long start = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - start;
            log.debug("[{}] {}() completed | result: {} | duration: {}ms",
                    className, methodName, summarizeResult(result), duration);
            return result;
        } catch (Throwable ex) {
            log.error("[{}] {}() failed | input: {} | message: {}",
                    className, methodName, inputSummary, ex.getMessage(), ex);
            throw ex;
        }
    }

    private String summarizeResult(Object result) {
        if (result == null) {
            return "null";
        }
        if (result instanceof java.util.Collection<?> collection) {
            return "Collection(size=" + collection.size() + ")";
        }
        if (result instanceof java.util.Map<?, ?> map) {
            return "Map(size=" + map.size() + ")";
        }
        return String.valueOf(result);
    }
}
