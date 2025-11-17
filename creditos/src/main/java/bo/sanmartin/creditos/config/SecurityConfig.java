package bo.sanmartin.creditos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").permitAll()
                .requestMatchers("/eureka/**").permitAll()
                
                .requestMatchers("/actuator/**").permitAll()
                
                // Permitir acceso a Swagger/OpenAPI (documentación de la API)
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                .anyRequest().permitAll()
            )

            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // Deshabilitar la página de login por defecto de Spring Security
            .formLogin(form -> form.disable())
            
            // Deshabilitar HTTP Basic Authentication
            .httpBasic(basic -> basic.disable());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",           // Cualquier puerto en localhost
            "http://127.0.0.1:*"             // También IP local
        ));
        configuration.setAllowedMethods(Arrays.asList(
            "GET",      // Obtener datos
            "POST",     // Crear recursos
            "PUT",      // Actualizar recursos (completo)
            "PATCH",    // Actualizar recursos (parcial)
            "DELETE",   // Eliminar recursos
            "OPTIONS"   // Preflight requests (automático del navegador)
        ));
        
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        configuration.setExposedHeaders(Arrays.asList(
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials",
            "Authorization",
            "Content-Disposition"  // Útil para descargas de archivos
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // 1 hora
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}