package bo.sanmartin.creditos.scheduler;

import bo.sanmartin.creditos.model.RegistroEnvio;
import bo.sanmartin.creditos.model.Socio;
import bo.sanmartin.creditos.repository.RegistroEnvioRepository;
import bo.sanmartin.creditos.service.SocioService;
import bo.sanmartin.creditos.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificacionScheduler {
    
    private final SocioService socioService;
    private final WhatsAppService whatsAppService;
    private final RegistroEnvioRepository registroEnvioRepository;
    
    @Value("${scheduler.hora-envio:9}")
    private int horaEnvio;
    
    @Value("${scheduler.minuto-envio:0}")
    private int minutoEnvio;
    
    /**
     * Tarea programada que se ejecuta todos los días a la hora configurada
     * Formato cron: segundo minuto hora día mes día-semana
     * Por defecto: 0 0 9 * * * (9:00 AM todos los días)
     */
    @Scheduled(cron = "${scheduler.cron:0 0 9 * * *}")
    public void enviarRecordatoriosPago() {
        log.info("=== Iniciando proceso de envío de recordatorios de pago ===");
        
        try {
            // Obtener socios con vencimiento mañana y préstamos activos
            List<Socio> sociosConVencimiento = socioService.obtenerSociosConVencimientoManana();
            
            log.info("Se encontraron {} socios con vencimiento mañana", sociosConVencimiento.size());
            
            int enviadosExitosos = 0;
            int enviadosFallidos = 0;
            int enviadosOmitidos = 0;
            
            for (Socio socio : sociosConVencimiento) {
                try {
                    // Verificar si ya se envió un mensaje para esta fecha de vencimiento
                    LocalDateTime fechaVencimiento = socio.getFechaVencimientoPago().atStartOfDay();
                    boolean yaEnviado = registroEnvioRepository.existeEnvioExitosoParaFecha(
                        socio.getId(), 
                        fechaVencimiento
                    );
                    
                    if (yaEnviado) {
                        log.info("Omitiendo envío a {} - Ya se envió mensaje para esta fecha", 
                            socio.getNombreCompleto());
                        enviadosOmitidos++;
                        continue;
                    }
                    
                    // Enviar recordatorio
                    RegistroEnvio registro = whatsAppService.enviarRecordatorioPago(socio);
                    
                    if (registro.getEstado() == RegistroEnvio.EstadoEnvio.EXITOSO) {
                        enviadosExitosos++;
                        log.info("✓ Recordatorio enviado a: {} - {}", 
                            socio.getNombreCompleto(), 
                            socio.getTelefono());
                    } else {
                        enviadosFallidos++;
                        log.error("✗ Fallo al enviar a: {} - Error: {}", 
                            socio.getNombreCompleto(), 
                            registro.getMensajeError());
                    }
                    
                    // Pequeña pausa entre envíos para no saturar la API
                    Thread.sleep(1000);
                    
                } catch (Exception e) {
                    enviadosFallidos++;
                    log.error("Error al procesar socio {}: {}", 
                        socio.getNombreCompleto(), 
                        e.getMessage(), 
                        e);
                }
            }
            
            log.info("=== Resumen del proceso ===");
            log.info("Total socios procesados: {}", sociosConVencimiento.size());
            log.info("Enviados exitosos: {}", enviadosExitosos);
            log.info("Enviados fallidos: {}", enviadosFallidos);
            log.info("Enviados omitidos (duplicados): {}", enviadosOmitidos);
            log.info("=== Proceso finalizado ===");
            
        } catch (Exception e) {
            log.error("Error crítico en el proceso de envío de recordatorios", e);
        }
    }
    
    /**
     * Método manual para ejecutar el envío de recordatorios bajo demanda
     */
    public void ejecutarEnvioManual() {
        log.info("Ejecutando envío manual de recordatorios");
        enviarRecordatoriosPago();
    }
    
    /**
     * Tarea de monitoreo que se ejecuta cada hora para registrar el estado
     */
    @Scheduled(fixedRate = 3600000) // Cada hora
    public void monitoreoProgramado() {
        log.debug("Scheduler activo - próxima ejecución programada a las {}:{}", 
            horaEnvio, 
            minutoEnvio);
    }
}
