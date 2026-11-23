package org.vixir;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.vixir.common.VixirProperties;

@SpringBootApplication
@EnableConfigurationProperties(VixirProperties.class)
public class VixirApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(VixirApiApplication.class, args);
    }
}
