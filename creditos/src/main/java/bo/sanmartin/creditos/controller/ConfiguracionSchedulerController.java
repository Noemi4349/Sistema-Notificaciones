package bo.sanmartin.creditos.controller;

import bo.sanmartin.creditos.dto.ConfiguracionSchedulerDTO;
import bo.sanmartin.creditos.model.ConfiguracionScheduler;
import bo.sanmartin.creditos.repository.ConfiguracionSchedulerRepository;
import bo.sanmartin.creditos.scheduler.NotificacionScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/configuracion-scheduler")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*") // Permitir peticiones desde el frontend
public class ConfiguracionSchedulerController {
    
    private final ConfiguracionSchedulerRepository configuracionRepository;
    private final NotificacionScheduler notificacionScheduler;
    
    /**
     * Obtener la configuración actual del scheduler
     */
    @GetMapping
    public ResponseEntity<ConfiguracionSchedulerDTO> obtenerConfiguracion() {
        log.info("📋 Obteniendo configuración del scheduler");
        
        ConfiguracionScheduler config = configuracionRepository.findConfiguracionActual()
            .orElseGet(() -> {
                // Crear configuración por defecto si no existe
                ConfiguracionScheduler nueva = new ConfiguracionScheduler();
                nueva.setHora(9);
                nueva.setMinuto(0);
                nueva.setActivo(true);
                nueva.setDiasAnticipacion(1);
                nueva.setModificadoPor("SISTEMA");
                return configuracionRepository.save(nueva);
            });
        
        ConfiguracionSchedulerDTO dto = convertirADTO(config);
        return ResponseEntity.ok(dto);
    }
    
    /**
     * Actualizar la configuración del scheduler
     */
    @PutMapping
    public ResponseEntity<ConfiguracionSchedulerDTO> actualizarConfiguracion(
            @RequestBody ConfiguracionSchedulerDTO dto) {
        
        log.info("🔧 Actualizando configuración del scheduler: {}:{} - Activo: {}", 
            dto.getHora(), dto.getMinuto(), dto.getActivo());
        
        try {
            // Validaciones
            if (dto.getHora() < 0 || dto.getHora() > 23) {
                return ResponseEntity.badRequest().build();
            }
            if (dto.getMinuto() < 0 || dto.getMinuto() > 59) {
                return ResponseEntity.badRequest().build();
            }
            
            // Obtener o crear configuración
            ConfiguracionScheduler config = configuracionRepository.findConfiguracionActual()
                .orElse(new ConfiguracionScheduler());
            
            // Actualizar valores
            config.setHora(dto.getHora());
            config.setMinuto(dto.getMinuto());
            config.setActivo(dto.getActivo());
            config.setDiasAnticipacion(dto.getDiasAnticipacion() != null ? dto.getDiasAnticipacion() : 1);
            config.setModificadoPor(dto.getModificadoPor() != null ? dto.getModificadoPor() : "USUARIO");
            
            // Guardar en base de datos
            ConfiguracionScheduler guardada = configuracionRepository.save(config);
            
            // Actualizar el scheduler en tiempo real
            notificacionScheduler.actualizarConfiguracion(guardada);
            
            log.info("✅ Configuración actualizada y scheduler reiniciado");
            
            return ResponseEntity.ok(convertirADTO(guardada));
            
        } catch (Exception e) {
            log.error("❌ Error al actualizar configuración", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Activar el scheduler
     */
    @PostMapping("/activar")
    public ResponseEntity<Map<String, Object>> activarScheduler() {
        log.info("▶️ Activando scheduler");
        
        try {
            ConfiguracionScheduler config = configuracionRepository.findConfiguracionActual()
                .orElseThrow(() -> new RuntimeException("No hay configuración"));
            
            config.setActivo(true);
            config.setModificadoPor("USUARIO");
            configuracionRepository.save(config);
            
            notificacionScheduler.actualizarConfiguracion(config);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("mensaje", "Scheduler activado correctamente");
            response.put("horaEjecucion", config.getHoraFormateada());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error al activar scheduler", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Desactivar el scheduler
     */
    @PostMapping("/desactivar")
    public ResponseEntity<Map<String, Object>> desactivarScheduler() {
        log.info("⏸️ Desactivando scheduler");
        
        try {
            ConfiguracionScheduler config = configuracionRepository.findConfiguracionActual()
                .orElseThrow(() -> new RuntimeException("No hay configuración"));
            
            config.setActivo(false);
            config.setModificadoPor("USUARIO");
            configuracionRepository.save(config);
            
            notificacionScheduler.actualizarConfiguracion(config);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("mensaje", "Scheduler desactivado correctamente");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error al desactivar scheduler", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Obtener estado actual del scheduler
     */
    @GetMapping("/estado")
    public ResponseEntity<Map<String, Object>> obtenerEstado() {
        ConfiguracionScheduler config = notificacionScheduler.getConfiguracionActual();
        
        Map<String, Object> estado = new HashMap<>();
        estado.put("activo", config.getActivo());
        estado.put("horaEjecucion", config.getHoraFormateada());
        estado.put("expresionCron", config.generarExpresionCron());
        estado.put("diasAnticipacion", config.getDiasAnticipacion());
        estado.put("ultimaModificacion", config.getUltimaModificacion());
        estado.put("modificadoPor", config.getModificadoPor());
        
        return ResponseEntity.ok(estado);
    }
    
    /**
     * Ejecutar tarea manualmente (sin esperar al horario programado)
     */
    @PostMapping("/ejecutar-ahora")
    public ResponseEntity<Map<String, Object>> ejecutarAhora() {
        log.info("🚀 Ejecutando envío manual inmediato");
        
        try {
            notificacionScheduler.ejecutarEnvioManual();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("mensaje", "Proceso de envío iniciado manualmente");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error al ejecutar envío manual", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Método auxiliar para convertir Entity a DTO
     */
    private ConfiguracionSchedulerDTO convertirADTO(ConfiguracionScheduler config) {
        ConfiguracionSchedulerDTO dto = new ConfiguracionSchedulerDTO();
        dto.setId(config.getId());
        dto.setHora(config.getHora());
        dto.setMinuto(config.getMinuto());
        dto.setActivo(config.getActivo());
        dto.setHoraFormateada(config.getHoraFormateada());
        dto.setExpresionCron(config.generarExpresionCron());
        dto.setDiasAnticipacion(config.getDiasAnticipacion());
        dto.setUltimaModificacion(config.getUltimaModificacion() != null ? 
            config.getUltimaModificacion().toString() : null);
        dto.setModificadoPor(config.getModificadoPor());
        return dto;
    }
}