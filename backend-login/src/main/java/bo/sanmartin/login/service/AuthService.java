package bo.sanmartin.login.service;

import bo.sanmartin.login.config.JwtService;
import bo.sanmartin.login.dto.AuthResponseDto;
import bo.sanmartin.login.dto.LoginRequestDto;
import bo.sanmartin.login.dto.UserRequestDto;
import bo.sanmartin.login.model.User;
import bo.sanmartin.login.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j  // ✅ Agregado para logging
@Service
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * ✅ Carga usuario por username (usado por Spring Security)
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("🔍 Buscando usuario: {}", username);
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("❌ Usuario no encontrado en BD: {}", username);
                    return new UsernameNotFoundException("Usuario no encontrado: " + username);
                });
        
        log.debug("✅ Usuario encontrado: {} (ID: {})", username, user.getId());
        return user;
    }

    /**
     * ✅ Registra un nuevo usuario
     */
    @Transactional
    public User registerUser(UserRequestDto userRequest) {
        log.info("📝 Intento de registro - Usuario: {}, Email: {}", 
                userRequest.getUsername(), userRequest.getEmail());

        // Validar username
        if (userRepository.existsByUsername(userRequest.getUsername())) {
            log.warn("⚠️ Username ya existe: {}", userRequest.getUsername());
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }

        // Validar email
        if (userRepository.existsByEmail(userRequest.getEmail())) {
            log.warn("⚠️ Email ya existe: {}", userRequest.getEmail());
            throw new RuntimeException("El correo electrónico ya está en uso");
        }

        // Crear usuario
        User user = User.builder()
                .nombre(userRequest.getNombre())
                .apellidoPaterno(userRequest.getApellidoPaterno())
                .apellidoMaterno(userRequest.getApellidoMaterno())
                .email(userRequest.getEmail())
                .username(userRequest.getUsername())
                .password(passwordEncoder.encode(userRequest.getPassword()))
                .estado(true)
                .build();

        // Guardar usuario
        User savedUser = userRepository.save(user);
        log.info("✅ Usuario registrado exitosamente - ID: {}, Username: {}", 
                savedUser.getId(), savedUser.getUsername());

        return savedUser;
    }

    /**
     * ✅ Autentica un usuario y genera token JWT
     */
    @Transactional(readOnly = true)
    public AuthResponseDto authenticate(LoginRequestDto loginRequest) {
        log.info("🔐 Intento de autenticación - Usuario: {}", loginRequest.getUsername());
        
        try {
            // 1. Buscar usuario
            User user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> {
                        log.error("❌ Usuario no encontrado: {}", loginRequest.getUsername());
                        return new UsernameNotFoundException("Usuario no encontrado");
                    });
            
            log.debug("✅ Usuario encontrado en BD - ID: {}, Estado: {}", user.getId(), user.getEstado());
            
            // 2. Verificar que el usuario esté activo
            if (!user.getEstado()) {
                log.warn("⚠️ Usuario inactivo intentando acceder: {}", loginRequest.getUsername());
                throw new RuntimeException("Usuario inactivo. Contacte al administrador.");
            }
            
            // 3. Verificar contraseña
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                log.error("❌ Contraseña incorrecta para usuario: {}", loginRequest.getUsername());
                throw new RuntimeException("Credenciales inválidas");
            }
            
            log.debug("✅ Contraseña correcta para: {}", loginRequest.getUsername());
            
            // 4. Generar token JWT
            String token = jwtService.generateToken(user);
            log.info("🔑 Token JWT generado para: {}", loginRequest.getUsername());
            
            // 5. Construir respuesta
            AuthResponseDto response = AuthResponseDto.builder()
                    .token(token)
                    .username(user.getUsername())
                    .estado(user.getEstado())
                    .build();
            
            log.info("✅ Autenticación exitosa - Usuario: {}", loginRequest.getUsername());
            
            return response;
            
        } catch (UsernameNotFoundException e) {
            log.error("❌ Error de autenticación (usuario no encontrado): {}", loginRequest.getUsername());
            throw e;
        } catch (RuntimeException e) {
            log.error("❌ Error de autenticación: {} - Usuario: {}", e.getMessage(), loginRequest.getUsername());
            throw e;
        } catch (Exception e) {
            log.error("❌ Error inesperado en autenticación para usuario {}: {}", 
                    loginRequest.getUsername(), e.getMessage(), e);
            throw new RuntimeException("Error en el proceso de autenticación", e);
        }
    }

    /**
     * ✅ Obtiene el usuario autenticado actualmente
     */
    @Transactional(readOnly = true)
    public User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                log.warn("⚠️ Intento de obtener usuario sin autenticación válida");
                throw new UsernameNotFoundException("Usuario no autenticado");
            }
            
            String username = authentication.getName();
            log.debug("🔍 Obteniendo usuario autenticado: {}", username);
            
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> {
                        log.error("❌ Usuario autenticado no encontrado en BD: {}", username);
                        return new UsernameNotFoundException("Usuario no encontrado");
                    });
            
            log.debug("✅ Usuario actual obtenido: {} (ID: {})", username, user.getId());
            return user;
            
        } catch (Exception e) {
            log.error("❌ Error al obtener usuario actual: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * ✅ Verifica si un usuario existe por username
     */
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        log.debug("🔍 Verificando existencia de username: {}", username);
        boolean exists = userRepository.existsByUsername(username);
        log.debug("📊 Username '{}' existe: {}", username, exists);
        return exists;
    }

    /**
     * ✅ Verifica si un usuario existe por email
     */
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        log.debug("🔍 Verificando existencia de email: {}", email);
        boolean exists = userRepository.existsByEmail(email);
        log.debug("📊 Email '{}' existe: {}", email, exists);
        return exists;
    }

    /**
     * ✅ Cambia el estado de un usuario
     */
    @Transactional
    public void cambiarEstadoUsuario(Long userId, boolean nuevoEstado) {
        log.info("🔄 Cambiando estado de usuario ID: {} a: {}", userId, nuevoEstado);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("❌ Usuario no encontrado con ID: {}", userId);
                    return new UsernameNotFoundException("Usuario no encontrado");
                });
        
        user.setEstado(nuevoEstado);
        userRepository.save(user);
        
        log.info("✅ Estado cambiado - Usuario: {}, Nuevo estado: {}", 
                user.getUsername(), nuevoEstado);
    }

    /**
     * ✅ Método de utilidad para debugging
     */
    public void logAuthenticationInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null) {
            log.debug("📊 Authentication Info:");
            log.debug("  - Principal: {}", authentication.getPrincipal());
            log.debug("  - Name: {}", authentication.getName());
            log.debug("  - Authenticated: {}", authentication.isAuthenticated());
            log.debug("  - Authorities: {}", authentication.getAuthorities());
        } else {
            log.debug("📊 No hay información de autenticación disponible");
        }
    }
}