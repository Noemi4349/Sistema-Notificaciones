package bo.sanmartin.creditos.controller;

import bo.sanmartin.creditos.dto.EstadisticasDiaDTO;
import bo.sanmartin.creditos.dto.RegistroEnvioDTO;
import bo.sanmartin.creditos.model.RegistroEnvio;
import bo.sanmartin.creditos.repository.RegistroEnvioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@Slf4j
public class ReporteController {
    
    private final RegistroEnvioRepository registroEnvioRepository;
    
    /**
     * Obtener registros de envíos por rango de fechas
     */
    @GetMapping("/envios")
    public ResponseEntity<List<RegistroEnvioDTO>> obtenerEnviosPorFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(required = false) String estado) {
        
        log.info("📊 Consultando envíos desde {} hasta {}", fechaInicio, fechaFin);
        
        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(LocalTime.MAX);
        
        List<RegistroEnvio> registros = registroEnvioRepository
            .findByFechaEnvioBetween(inicio, fin);
        
        // Filtrar por estado si se proporciona
        if (estado != null && !estado.equals("TODOS")) {
            RegistroEnvio.EstadoEnvio estadoEnum = RegistroEnvio.EstadoEnvio.valueOf(estado);
            registros = registros.stream()
                .filter(r -> r.getEstado() == estadoEnum)
                .collect(Collectors.toList());
        }
        
        // Convertir a DTO
        List<RegistroEnvioDTO> dtos = registros.stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
        
        log.info("✅ Encontrados {} registros", dtos.size());
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * Obtener estadísticas agrupadas por día
     */
    @GetMapping("/estadisticas-por-dia")
    public ResponseEntity<List<EstadisticasDiaDTO>> obtenerEstadisticasPorDia(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        
        log.info("📊 Generando estadísticas por día desde {} hasta {}", fechaInicio, fechaFin);
        
        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(LocalTime.MAX);
        
        List<RegistroEnvio> registros = registroEnvioRepository
            .findByFechaEnvioBetween(inicio, fin);
        
        // Agrupar por fecha
        Map<LocalDate, List<RegistroEnvio>> porFecha = registros.stream()
            .collect(Collectors.groupingBy(r -> r.getFechaEnvio().toLocalDate()));
        
        // Crear estadísticas por cada día
        List<EstadisticasDiaDTO> estadisticas = new ArrayList<>();
        
        LocalDate fecha = fechaInicio;
        while (!fecha.isAfter(fechaFin)) {
            List<RegistroEnvio> registrosDia = porFecha.getOrDefault(fecha, Collections.emptyList());
            
            long total = registrosDia.size();
            long exitosos = registrosDia.stream()
                .filter(r -> r.getEstado() == RegistroEnvio.EstadoEnvio.EXITOSO)
                .count();
            long fallidos = registrosDia.stream()
                .filter(r -> r.getEstado() == RegistroEnvio.EstadoEnvio.FALLIDO)
                .count();
            long pendientes = registrosDia.stream()
                .filter(r -> r.getEstado() == RegistroEnvio.EstadoEnvio.PENDIENTE)
                .count();
            
            EstadisticasDiaDTO stat = new EstadisticasDiaDTO();
            stat.setFecha(fecha.toString());
            stat.setTotal(total);
            stat.setExitosos(exitosos);
            stat.setFallidos(fallidos);
            stat.setPendientes(pendientes);
            
            estadisticas.add(stat);
            fecha = fecha.plusDays(1);
        }
        
        log.info("✅ Estadísticas generadas para {} días", estadisticas.size());
        return ResponseEntity.ok(estadisticas);
    }
    
    /**
     * Obtener resumen general
     */
    @GetMapping("/resumen")
    public ResponseEntity<Map<String, Object>> obtenerResumenGeneral() {
        long totalEnvios = registroEnvioRepository.count();
        long exitosos = registroEnvioRepository
            .findByEstado(RegistroEnvio.EstadoEnvio.EXITOSO).size();
        long fallidos = registroEnvioRepository
            .findByEstado(RegistroEnvio.EstadoEnvio.FALLIDO).size();
        long pendientes = registroEnvioRepository
            .findByEstado(RegistroEnvio.EstadoEnvio.PENDIENTE).size();
        
        Map<String, Object> resumen = new HashMap<>();
        resumen.put("totalEnvios", totalEnvios);
        resumen.put("exitosos", exitosos);
        resumen.put("fallidos", fallidos);
        resumen.put("pendientes", pendientes);
        resumen.put("tasaExito", totalEnvios > 0 ? (exitosos * 100.0 / totalEnvios) : 0);
        
        return ResponseEntity.ok(resumen);
    }
    
    /**
     * Convertir RegistroEnvio a DTO (sin referencias circulares)
     */
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
            dto.setNombreSocio(registro.getSocio().getNombreCompleto());
            dto.setSocioId(registro.getSocio().getId());
        }
        
        return dto;
    }
}