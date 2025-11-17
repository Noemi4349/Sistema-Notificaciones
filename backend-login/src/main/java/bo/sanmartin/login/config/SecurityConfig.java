package bo.sanmartin.login.config;

import bo.sanmartin.login.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService customUserDetailsService;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ✅ CAMBIO 1: Deshabilitar CSRF
            .csrf(AbstractHttpConfigurer::disable)
            
            // ✅ CAMBIO 2: AGREGAR CORS - CRÍTICO para frontend
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // ✅ CAMBIO 3: Configuración de autorización mejorada
            .authorizeHttpRequests(auth -> auth
                // 🔓 Endpoints públicos (sin autenticación requerida)
                .requestMatchers(
                    "/api/auth/**",           // Todos los endpoints de autenticación
                    "/api/auth/login",        // Login específico
                    "/api/auth/register",     // Registro específico
                    "/api/auth/test",         // Test endpoint
                    "/error",                 // Página de error
                    "/v3/api-docs/**",        // Swagger docs (si lo usas)
                    "/swagger-ui/**",         // Swagger UI (si lo usas)
                    "/swagger-ui.html",       // 🔧 CORREGIDO: agregada coma aquí
                    "/api/recordatorios/**"
                ).permitAll()
                
                // 🔐 Endpoints protegidos - MEDIA
                .requestMatchers("/api/media/**").authenticated()
                
                // 🔐 Endpoints protegidos - USERS
                .requestMatchers("/api/users/**").authenticated()
                
                // 🔐 Cualquier otra petición requiere autenticación
                .anyRequest().authenticated() // 🔧 CORREGIDO: agregado punto y coma al final
            )
            
            // ✅ CAMBIO 4: Sesión sin estado (stateless) para JWT
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // ✅ CAMBIO 5: Proveedor de autenticación
            .authenticationProvider(authenticationProvider())
            
            // ✅ CAMBIO 6: Agregar filtro JWT
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            
            // ✅ CAMBIO 7: Manejo de excepciones mejorado
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write(
                        "{\"error\": \"No autorizado\", " +
                        "\"message\": \"Token inválido o expirado\", " +
                        "\"status\": 401, " +
                        "\"timestamp\": \"" + java.time.LocalDateTime.now() + "\"}"
                    );
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write(
                        "{\"error\": \"Acceso denegado\", " +
                        "\"message\": \"No tienes permisos para acceder a este recurso\", " +
                        "\"status\": 403, " +
                        "\"timestamp\": \"" + java.time.LocalDateTime.now() + "\"}"
                    );
                })
            );

        return http.build();
    }

    /**
     * ✅ CAMBIO PRINCIPAL: Configuración de CORS
     * Esta es la parte MÁS IMPORTANTE para conectar con tu frontend
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ✅ CAMBIO: Permitir tu frontend Angular en puerto 4200
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200"
        ));
        
        // ✅ Permitir todos los orígenes (para desarrollo)
        // 📝 En producción cambia esto a: Arrays.asList("https://tudominio.com")
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        
        // ✅ Métodos HTTP permitidos
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"
        ));
        
        // ✅ Headers permitidos (importante para Authorization con JWT)
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "Accept",
            "X-Requested-With",
            "Cache-Control"
        ));
        
        // ✅ Permitir credenciales (cookies, authorization headers)
        configuration.setAllowCredentials(true);
        
        // ✅ Headers expuestos al cliente (importante para leer Authorization)
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "Content-Disposition"
        ));
        
        // ✅ Tiempo de caché de configuración CORS (1 hora)
        configuration.setMaxAge(3600L);
        
        // ✅ Aplicar configuración a todas las rutas
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }

    /**
     * ✅ Bean de AuthenticationProvider (sin cambios significativos)
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }
}