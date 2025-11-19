package bo.sanmartin.creditos.controller;

import bo.sanmartin.creditos.dto.RegistroEnvioDTO;
import bo.sanmartin.creditos.dto.SocioDTO;
import bo.sanmartin.creditos.mapper.SocioMapper;
import bo.sanmartin.creditos.model.RegistroEnvio;
import bo.sanmartin.creditos.model.Socio;
import bo.sanmartin.creditos.repository.RegistroEnvioRepository;
import bo.sanmartin.creditos.scheduler.NotificacionScheduler;
import bo.sanmartin.creditos.service.SocioService;
import bo.sanmartin.creditos.service.WhatsAppService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/socios")
@RequiredArgsConstructor
@Slf4j
public class SocioController {
    
    private final SocioService socioService;
    private final WhatsAppService whatsAppService;
    private final RegistroEnvioRepository registroEnvioRepository;
    private final NotificacionScheduler notificacionScheduler;
    private final SocioMapper socioMapper; // ← NUEVO

    
    @PostMapping
    public ResponseEntity<?> registrarSocio(@Valid @RequestBody SocioDTO socioDTO) {
        try {
            log.info("📝 Registrando socio: {}", socioDTO);
            
            // Convertir DTO a Entity
            Socio socio = socioMapper.toEntity(socioDTO);
            
            // Guardar en la base de datos
            Socio nuevoSocio = socioService.registrarSocio(socio);
            
            // Convertir Entity a DTO para la respuesta
            SocioDTO respuesta = socioMapper.toDTO(nuevoSocio);
            
            log.info("✅ Socio registrado exitosamente: {}", respuesta);
            return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
            
        } catch (IllegalArgumentException e) {
            log.error("❌ Error al registrar socio: {}", e.getMessage());
            return ResponseEntity.badRequest().body(crearRespuestaError(e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Error inesperado al registrar socio", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(crearRespuestaError("Error interno del servidor"));
        }
    }
    
    @GetMapping
    public ResponseEntity<List<SocioDTO>> obtenerTodosSocios() {
        try {
            log.info("📥 Obteniendo todos los socios");
            
            List<Socio> socios = socioService.obtenerTodosLosSocios();
            List<SocioDTO> sociosDTO = socioMapper.toDTOList(socios);
            
            log.info("✅ Devolviendo {} socios", sociosDTO.size());
            return ResponseEntity.ok(sociosDTO);
            
        } catch (Exception e) {
            log.error("❌ Error al obtener socios", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerSocioPorId(@PathVariable Long id) {
        return socioService.obtenerSocioPorId(id)
            .map(socio -> ResponseEntity.ok(socioMapper.toDTO(socio)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/numero/{numeroSocio}")
    public ResponseEntity<?> obtenerSocioPorNumero(@PathVariable String numeroSocio) {
        return socioService.obtenerSocioPorNumero(numeroSocio)
            .map(socio -> ResponseEntity.ok(socioMapper.toDTO(socio)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/activos")
    public ResponseEntity<List<SocioDTO>> obtenerSociosActivos() {
        List<Socio> socios = socioService.obtenerSociosActivos();
        List<SocioDTO> sociosDTO = socioMapper.toDTOList(socios);
        return ResponseEntity.ok(sociosDTO);
    }
    
    @GetMapping("/vencimiento-manana")
    public ResponseEntity<List<SocioDTO>> obtenerSociosConVencimientoManana() {
        List<Socio> socios = socioService.obtenerSociosConVencimientoManana();
        List<SocioDTO> sociosDTO = socioMapper.toDTOList(socios);
        return ResponseEntity.ok(sociosDTO);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarSocio(
            @PathVariable Long id, 
            @Valid @RequestBody SocioDTO socioDTO) {
        try {
            log.info("🔄 Actualizando socio ID: {}", id);
            
            // Convertir DTO a Entity
            Socio socio = socioMapper.toEntity(socioDTO);
            
            // Actualizar
            Socio socioActualizado = socioService.actualizarSocio(id, socio);
            
            // Convertir a DTO para la respuesta
            SocioDTO respuesta = socioMapper.toDTO(socioActualizado);
            
            log.info("✅ Socio actualizado: {}", respuesta);
            return ResponseEntity.ok(respuesta);
            
        } catch (IllegalArgumentException e) {
            log.error("❌ Error al actualizar socio: {}", e.getMessage());
            return ResponseEntity.badRequest().body(crearRespuestaError(e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Error inesperado al actualizar socio", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(crearRespuestaError("Error interno del servidor"));
        }
    }
    
    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstadoSocio(
            @PathVariable Long id, 
            @RequestParam Boolean estado) {
        try {
            log.info("🔄 Cambiando estado del socio {} a {}", id, estado);
            socioService.cambiarEstadoSocio(id, estado);
            log.info("✅ Estado cambiado correctamente");
            return ResponseEntity.ok(crearRespuestaExito("Estado actualizado correctamente"));
        } catch (IllegalArgumentException e) {
            log.error("❌ Error al cambiar estado: {}", e.getMessage());
            return ResponseEntity.badRequest().body(crearRespuestaError(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarSocio(@PathVariable Long id) {
        try {
            log.info("🗑️ Eliminando socio ID: {}", id);
            socioService.eliminarSocio(id);
            log.info("✅ Socio eliminado correctamente");
            return ResponseEntity.ok(crearRespuestaExito("Socio eliminado correctamente"));
        } catch (IllegalArgumentException e) {
            log.error("❌ Error al eliminar socio: {}", e.getMessage());
            return ResponseEntity.badRequest().body(crearRespuestaError(e.getMessage()));
        }
    }
    
    // Endpoints para mensajería
    
@PostMapping("/{id}/enviar-recordatorio")
public ResponseEntity<RegistroEnvioDTO> enviarRecordatorioManual(@PathVariable Long id) {
    return socioService.obtenerSocioPorId(id)
        .map(socio -> {
            RegistroEnvio registro = whatsAppService.enviarRecordatorioPago(socio);
            return ResponseEntity.ok(convertirADTO(registro));
        })
        .orElse(ResponseEntity.notFound().build());
}

private RegistroEnvioDTO convertirADTO(RegistroEnvio registro) {
    RegistroEnvioDTO dto = new RegistroEnvioDTO();
    dto.setId(registro.getId());
    dto.setFechaEnvio(registro.getFechaEnvio().toString());
    dto.setNumeroDestino(registro.getNumeroDestino());
    dto.setMensaje(registro.getMensaje());
    dto.setEstado(registro.getEstado().name());
    dto.setMensajeError(registro.getMensajeError());
    dto.setIdExterno(registro.getIdExterno());

    if (registro.getSocio() != null) {
        dto.setSocioId(registro.getSocio().getId());
        dto.setNombreSocio(registro.getSocio().getNombreCompleto());
    }
    
    return dto;
}
  
 // Agregar DESPUÉS del método enviarRecordatorioManual
@PostMapping("/enviar-mensaje-prueba")
public ResponseEntity<?> enviarMensajePrueba(@RequestBody Map<String, String> datos) {
    try {
        String numero = datos.get("numero");
        String mensaje = datos.get("mensaje");
        
        log.info("📤 Enviando mensaje de prueba a: {}", numero);
        
        // 1. Enviar el mensaje
        boolean enviado = whatsAppService.enviarMensaje(numero, mensaje);
        
        // 2. Crear y guardar el registro
        RegistroEnvio registro = new RegistroEnvio();
        registro.setNumeroDestino(numero);
        registro.setMensaje(mensaje);
        registro.setFechaEnvio(java.time.LocalDateTime.now());
        registro.setEstado(enviado ? 
            RegistroEnvio.EstadoEnvio.EXITOSO : 
            RegistroEnvio.EstadoEnvio.FALLIDO);
        
        // Intentar buscar y asociar el socio por número de teléfono
        try {
            String numeroBusqueda = numero.replaceAll("[^0-9]", "");
            
            // Buscar por el campo 'telefono' que ya tienes en Socio
            Socio socio = socioService.obtenerTodosLosSocios().stream()
                .filter(s -> s.getTelefono().contains(numeroBusqueda) || 
                            numeroBusqueda.contains(s.getTelefono()))
                .findFirst()
                .orElse(null);
            
            if (socio != null) {
                registro.setSocio(socio);
                log.info("✅ Mensaje asociado al socio: {}", socio.getNombreCompleto());
            } else {
                log.warn("⚠️ No se encontró socio con el número: {}", numero);
            }
        } catch (Exception e) {
            log.warn("⚠️ No se pudo asociar el mensaje a un socio: {}", e.getMessage());
        }
        
        // Guardar el registro en la base de datos
        RegistroEnvio registroGuardado = registroEnvioRepository.save(registro);
        
        log.info("✅ Mensaje enviado y registrado con ID: {}", registroGuardado.getId());
        
        return ResponseEntity.ok(convertirADTO(registroGuardado));
        
    } catch (Exception e) {
        log.error("❌ Error al enviar mensaje de prueba", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(crearRespuestaError("Error al enviar mensaje: " + e.getMessage()));
    }
}

    @PostMapping("/ejecutar-envio-programado")
    public ResponseEntity<?> ejecutarEnvioProgramadoManual() {
        notificacionScheduler.ejecutarEnvioManual();
        return ResponseEntity.ok(crearRespuestaExito("Proceso de envío iniciado"));
    }
    
   // @GetMapping("/{id}/historial-envios")
   // public ResponseEntity<List<RegistroEnvio>> obtenerHistorialEnvios(@PathVariable Long id) {
   //     List<RegistroEnvio> registros = registroEnvioRepository
   //         .findBySocioIdOrderByFechaEnvioDesc(id);
   //     return ResponseEntity.ok(registros);
   // }
   // SocioController.java - Método corregido
@GetMapping("/{id}/historial-envios")
public ResponseEntity<List<RegistroEnvioDTO>> obtenerHistorialEnvios(@PathVariable Long id) {
    try {
        Socio socio = socioService.obtenerSocioPorId(id)
            .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        
        // Usar el repositorio directamente
        List<RegistroEnvio> registros = registroEnvioRepository
            .findBySocioIdOrderByFechaEnvioDesc(id);
        
        // Convertir a DTO para evitar recursión circular
        List<RegistroEnvioDTO> registrosDTO = registros.stream()
            .map(registro -> new RegistroEnvioDTO(
                registro.getId(),
                socio.getId(),
                socio.getNombre() + " " + socio.getApellidoPaterno(),
                registro.getFechaEnvio().toString(),
                registro.getNumeroDestino(),
                registro.getMensaje(),
                registro.getEstado().name(), // ← Convertir enum a String
                registro.getMensajeError(),
                registro.getIdExterno()
            ))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(registrosDTO);
    } catch (Exception e) {
        log.error("❌ Error al obtener historial de envíos", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
    
    @GetMapping("/estadisticas-envios")
    public ResponseEntity<?> obtenerEstadisticasEnvios() {
        long totalEnvios = registroEnvioRepository.count();
        long enviosExitosos = registroEnvioRepository
            .findByEstado(RegistroEnvio.EstadoEnvio.EXITOSO).size();
        long enviosFallidos = registroEnvioRepository
            .findByEstado(RegistroEnvio.EstadoEnvio.FALLIDO).size();
        
        Map<String, Object> estadisticas = new HashMap<>();
        estadisticas.put("totalEnvios", totalEnvios);
        estadisticas.put("enviosExitosos", enviosExitosos);
        estadisticas.put("enviosFallidos", enviosFallidos);
        estadisticas.put("tasaExito", totalEnvios > 0 ? 
            (enviosExitosos * 100.0 / totalEnvios) : 0);
        
        return ResponseEntity.ok(estadisticas);
    }
    
    // Métodos auxiliares
    
    private Map<String, String> crearRespuestaError(String mensaje) {
        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("error", mensaje);
        return respuesta;
    }
    
    private Map<String, String> crearRespuestaExito(String mensaje) {
        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("mensaje", mensaje);
        return respuesta;
    }
}
