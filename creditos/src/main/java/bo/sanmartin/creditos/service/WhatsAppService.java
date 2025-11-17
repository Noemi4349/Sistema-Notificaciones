package bo.sanmartin.creditos.service;

import bo.sanmartin.creditos.model.RegistroEnvio;
import bo.sanmartin.creditos.model.Socio;
import bo.sanmartin.creditos.repository.RegistroEnvioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class WhatsAppService {
    
    private final RegistroEnvioRepository registroEnvioRepository;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    @Value("${whatsapp.service.url:http://localhost:3000}")
    private String whatsappServiceUrl;
    
    public WhatsAppService(RegistroEnvioRepository registroEnvioRepository) {
        this.registroEnvioRepository = registroEnvioRepository;
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .build();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Envía un mensaje de recordatorio de pago a un socio
     */
    public RegistroEnvio enviarRecordatorioPago(Socio socio) {
        String mensaje = construirMensajeRecordatorio(socio);
        String numeroDestino = socio.getTelefono();
        
        RegistroEnvio registro = new RegistroEnvio();
        registro.setSocio(socio);
        registro.setNumeroDestino(numeroDestino);
        registro.setMensaje(mensaje);
        registro.setFechaVencimientoReferencia(socio.getFechaVencimientoPago().atStartOfDay());
        registro.setEstado(RegistroEnvio.EstadoEnvio.PENDIENTE);
        
        try {
            log.info("Enviando mensaje WhatsApp a {}: {}", socio.getNombreCompleto(), numeroDestino);
            
            // Verificar que el servicio esté conectado
            if (!verificarConexion()) {
                throw new Exception("El servicio de WhatsApp no está conectado. Por favor escanea el código QR en http://localhost:3000/qr");
            }
            
            String respuesta = enviarMensajeBaileys(numeroDestino, mensaje);
            
            registro.setEstado(RegistroEnvio.EstadoEnvio.EXITOSO);
            registro.setIdExterno(respuesta);
            
            log.info("✅ Mensaje enviado exitosamente a {}", socio.getNombreCompleto());
            
        } catch (Exception e) {
            log.error("❌ Error al enviar mensaje a {}: {}", socio.getNombreCompleto(), e.getMessage(), e);
            registro.setEstado(RegistroEnvio.EstadoEnvio.FALLIDO);
            registro.setMensajeError(e.getMessage());
        }
        
        return registroEnvioRepository.save(registro);
    }
    
    /**
     * Verifica si el servicio de WhatsApp está conectado
     */
    private boolean verificarConexion() {
        try {
            Request request = new Request.Builder()
                .url(whatsappServiceUrl + "/status")
                .get()
                .build();
            
            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    String body = response.body().string();
                    JsonNode json = objectMapper.readTree(body);
                    boolean connected = json.get("connected").asBoolean();
                    
                    if (!connected) {
                        log.warn("⚠️ WhatsApp no está conectado. QR disponible en: {}/qr", whatsappServiceUrl);
                    }
                    
                    return connected;
                }
            }
        } catch (Exception e) {
            log.error("Error al verificar conexión de WhatsApp: {}", e.getMessage());
        }
        return false;
    }
    
    /**
     * Envía el mensaje usando el servicio gratuito de Baileys
     */
    private String enviarMensajeBaileys(String numero, String mensaje) throws Exception {
        MediaType JSON = MediaType.parse("application/json; charset=utf-8");
        
        String json = String.format("{\"numero\":\"%s\",\"mensaje\":\"%s\"}", 
            numero, 
            mensaje.replace("\n", "\\n").replace("\"", "\\\""));
        
        RequestBody body = RequestBody.create(json, JSON);
        
        Request request = new Request.Builder()
            .url(whatsappServiceUrl + "/enviar-mensaje")
            .post(body)
            .build();
        
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "Sin detalles";
                throw new Exception("Error en el servicio: " + response.code() + " - " + errorBody);
            }
            
            String responseBody = response.body() != null ? response.body().string() : "";
            log.debug("Respuesta del servicio WhatsApp: {}", responseBody);
            
            // Extraer timestamp como ID
            JsonNode jsonResponse = objectMapper.readTree(responseBody);
            return jsonResponse.has("timestamp") ? 
                jsonResponse.get("timestamp").asText() : 
                "SUCCESS-" + System.currentTimeMillis();
        }
    }
    
    /**
     * Construye el mensaje de recordatorio personalizado
     */
    private String construirMensajeRecordatorio(Socio socio) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String fechaFormateada = socio.getFechaVencimientoPago().format(formatter);
        
        return String.format(
            "🔔 *Recordatorio de Pago*\n\n" +
            "Hola *%s*,\n\n" +
            "Te recordamos que tu cuota vence *mañana %s*.\n\n" +
            "📋 Número de socio: *%s*\n\n" +
            "Por favor, realiza tu pago a tiempo para evitar cargos adicionales.\n\n" +
            "Gracias por tu preferencia. 🙏",
            socio.getNombre(),
            fechaFormateada,
            socio.getNumeroSocio()
        );
    }
    
    /**
     * Método de testing para verificar que todo funciona
     */
    public void enviarMensajePrueba(String numero, String mensaje) throws Exception {
        log.info("📤 Enviando mensaje de prueba a: {}", numero);
        enviarMensajeBaileys(numero, mensaje);
    }
}