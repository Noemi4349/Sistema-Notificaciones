package bo.sanmartin.creditos.scheduler;

import bo.sanmartin.creditos.model.ConfiguracionScheduler;
import bo.sanmartin.creditos.model.RegistroEnvio;
import bo.sanmartin.creditos.model.Socio;
import bo.sanmartin.creditos.repository.ConfiguracionSchedulerRepository;
import bo.sanmartin.creditos.repository.RegistroEnvioRepository;
import bo.sanmartin.creditos.service.SocioService;
import bo.sanmartin.creditos.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ScheduledFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificacionScheduler implements SchedulingConfigurer {
    
    private final SocioService socioService;
    private final WhatsAppService whatsAppService;
    private final RegistroEnvioRepository registroEnvioRepository;
    private final ConfiguracionSchedulerRepository configuracionRepository;
    private final TaskScheduler taskScheduler;
    
    private ScheduledFuture<?> tareaActual;
    private ConfiguracionScheduler configuracionActual;
    
    @PostConstruct
    public void inicializar() {
        // Crear configuración por defecto si no existe
        configuracionActual = configuracionRepository.findConfiguracionActual()
            .orElseGet(() -> {
                ConfiguracionScheduler config = new ConfiguracionScheduler();
                config.setHora(9);
                config.setMinuto(0);
                config.setActivo(true);
                config.setDiasAnticipacion(1);
                config.setModificadoPor("SISTEMA");
                return configuracionRepository.save(config);
            });
        
        log.info("⚙️ Scheduler inicializado con configuración: {} - Activo: {}", 
            configuracionActual.getHoraFormateada(), 
            configuracionActual.getActivo());
        
        // Iniciar tarea si está activa
        if (configuracionActual.getActivo()) {
            iniciarTareaProgramada();
        }
    }
    
    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        taskRegistrar.setTaskScheduler(taskScheduler);
    }
    
    /**
     * Inicia o reinicia la tarea programada con la configuración actual
     */
    public void iniciarTareaProgramada() {
        // Cancelar tarea anterior si existe
        detenerTareaProgramada();
        
        if (configuracionActual != null && configuracionActual.getActivo()) {
            String expresionCron = configuracionActual.generarExpresionCron();
            
            tareaActual = taskScheduler.schedule(
                this::enviarRecordatoriosPago,
                new CronTrigger(expresionCron)
            );
            
            log.info("✅ Tarea programada iniciada: {} (Cron: {})", 
                configuracionActual.getHoraFormateada(), 
                expresionCron);
        }
    }
    
    /**
     * Detiene la tarea programada
     */
    public void detenerTareaProgramada() {
        if (tareaActual != null && !tareaActual.isCancelled()) {
            tareaActual.cancel(false);
            log.info("🛑 Tarea programada detenida");
        }
    }
    
    /**
     * Actualiza la configuración y reinicia el scheduler
     */
    public void actualizarConfiguracion(ConfiguracionScheduler nuevaConfig) {
        this.configuracionActual = nuevaConfig;
        
        if (nuevaConfig.getActivo()) {
            iniciarTareaProgramada();
        } else {
            detenerTareaProgramada();
        }
    }
    
    /**
     * Obtiene la configuración actual
     */
    public ConfiguracionScheduler getConfiguracionActual() {
        return configuracionActual;
    }
    
    /**
     * Tarea programada que se ejecuta según la configuración
     */
    public void enviarRecordatoriosPago() {
        if (!configuracionActual.getActivo()) {
            log.info("⏸️ Scheduler desactivado, omitiendo ejecución");
            return;
        }
        
        log.info("=== Iniciando proceso de envío de recordatorios de pago ===");
        
        try {
            // Obtener socios con vencimiento según días de anticipación
            List<Socio> sociosConVencimiento = socioService.obtenerSociosConVencimientoManana();
            
            log.info("Se encontraron {} socios con vencimiento", sociosConVencimiento.size());
            
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
        log.info("📤 Ejecutando envío manual de recordatorios");
        enviarRecordatoriosPago();
    }
}