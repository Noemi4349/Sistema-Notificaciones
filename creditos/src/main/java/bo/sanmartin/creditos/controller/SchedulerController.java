package bo.sanmartin.creditos.controller;

import bo.sanmartin.creditos.model.Socio;
import bo.sanmartin.creditos.scheduler.NotificacionScheduler;
import bo.sanmartin.creditos.service.SocioService;
import bo.sanmartin.creditos.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scheduler")
@RequiredArgsConstructor
@Slf4j
public class SchedulerController {
    
    private final NotificacionScheduler notificacionScheduler;
    private final SocioService socioService;
    private final WhatsAppService whatsAppService;
    
    /**
     * Ejecutar envío manual de recordatorios
     */
    @PostMapping("/ejecutar-manual")
    public ResponseEntity<Map<String, Object>> ejecutarManual() {
        log.info("📢 Ejecución manual de recordatorios solicitada");
        
        try {
            notificacionScheduler.ejecutarEnvioManual();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("mensaje", "Proceso de envío ejecutado correctamente");
            response.put("timestamp", java.time.LocalDateTime.now());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error en ejecución manual", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Ver socios que recibirán recordatorio mañana
     */
    @GetMapping("/proximos-envios")
    public ResponseEntity<Map<String, Object>> proximosEnvios() {
        List<Socio> socios = socioService.obtenerSociosConVencimientoManana();
        
        Map<String, Object> response = new HashMap<>();
        response.put("cantidad", socios.size());
        response.put("socios", socios.stream().map(s -> {
            Map<String, String> info = new HashMap<>();
            info.put("nombre", s.getNombreCompleto());
            info.put("telefono", s.getTelefono());
            info.put("numeroSocio", s.getNumeroSocio());
            info.put("fechaVencimiento", s.getFechaVencimientoPago().toString());
            return info;
        }).toList());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Enviar mensaje de prueba
     */
    @PostMapping("/test-mensaje")
    public ResponseEntity<Map<String, Object>> testMensaje(
        @RequestParam String numero,
        @RequestParam(defaultValue = "Este es un mensaje de prueba del sistema de recordatorios.") String mensaje
    ) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            whatsAppService.enviarMensajePrueba(numero, mensaje);
            
            response.put("success", true);
            response.put("mensaje", "Mensaje de prueba enviado correctamente");
            response.put("numeroDestino", numero);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al enviar mensaje de prueba", e);
            
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Estado del scheduler
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        List<Socio> proximosEnvios = socioService.obtenerSociosConVencimientoManana();
        
        Map<String, Object> response = new HashMap<>();
        response.put("schedulerActivo", true);
        response.put("proximaEjecucion", "Diario a las 9:00 AM");
        response.put("sociosConVencimientoManana", proximosEnvios.size());
        response.put("whatsappServiceUrl", "http://localhost:3000");
        response.put("qrUrl", "http://localhost:3000/qr");
        
        return ResponseEntity.ok(response);
    }
}