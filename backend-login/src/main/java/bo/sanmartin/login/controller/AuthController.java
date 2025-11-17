package bo.sanmartin.login.controller;

import bo.sanmartin.login.dto.AuthResponseDto;
import bo.sanmartin.login.dto.LoginRequestDto;
import bo.sanmartin.login.dto.UserRequestDto;
import bo.sanmartin.login.model.User;
import bo.sanmartin.login.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;


@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")  // ✅ CRÍTICO: Permite CORS desde cualquier origen
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * LOGIN - Endpoint de autenticación
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto loginRequest) {
        log.info("📥 Login request - Usuario: {}", loginRequest.getUsername());
        
        try {
            AuthResponseDto response = authService.authenticate(loginRequest);
            log.info("✅ Login exitoso - Usuario: {}", loginRequest.getUsername());
            return ResponseEntity.ok(response);
            
        } catch (UsernameNotFoundException e) {
            log.error("❌ Usuario no encontrado: {}", loginRequest.getUsername());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Usuario no encontrado", HttpStatus.UNAUTHORIZED));
                    
        } catch (RuntimeException e) {
            log.error("❌ Error de autenticación: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED));
                    
        } catch (Exception e) {
            log.error("❌ Error inesperado en login: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error interno del servidor", HttpStatus.INTERNAL_SERVER_ERROR));
        }
    }

    /**
     * REGISTER - Registrar nuevo usuario
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRequestDto userRequest) {
        log.info("📥 Registro request - Usuario: {}", userRequest.getUsername());
        
        try {
            User newUser = authService.registerUser(userRequest);
            log.info("✅ Usuario registrado: {}", newUser.getUsername());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Usuario registrado exitosamente");
            response.put("username", newUser.getUsername());
            response.put("email", newUser.getEmail());
            response.put("userId", newUser.getId());
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
            
        } catch (RuntimeException e) {
            log.error("❌ Error en registro: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST));
                    
        } catch (Exception e) {
            log.error("❌ Error inesperado en registro: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error interno del servidor", HttpStatus.INTERNAL_SERVER_ERROR));
        }
    }

    /**
     * ME - Obtener usuario autenticado actual
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        log.info("📥 Request de usuario actual");
        
        try {
            User user = authService.getCurrentUser();
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("nombre", user.getNombre());
            response.put("apellidoPaterno", user.getApellidoPaterno());
            response.put("apellidoMaterno", user.getApellidoMaterno());
            response.put("estado", user.getEstado());
            
            log.info("✅ Usuario obtenido: {}", user.getUsername());
            return ResponseEntity.ok(response);
            
        } catch (UsernameNotFoundException e) {
            log.error("❌ Usuario no autenticado");
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("No autenticado", HttpStatus.UNAUTHORIZED));
                    
        } catch (Exception e) {
            log.error("❌ Error al obtener usuario: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error interno del servidor", HttpStatus.INTERNAL_SERVER_ERROR));
        }
    }

    /**
     * TEST - Endpoint de prueba para verificar conectividad
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        log.info("🧪 Test endpoint llamado");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Backend funcionando correctamente");
        response.put("timestamp", LocalDateTime.now());
        response.put("version", "1.0.0");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Método auxiliar para crear respuestas de error consistentes
     */
    private Map<String, Object> createErrorResponse(String message, HttpStatus status) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", message);
        error.put("status", status.value());
        error.put("timestamp", LocalDateTime.now());
        return error;
    }
}