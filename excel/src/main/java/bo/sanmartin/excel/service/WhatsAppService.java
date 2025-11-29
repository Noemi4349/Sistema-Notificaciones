package bo.sanmartin.excel.service;

import bo.sanmartin.excel.entity.MensajeEnviado;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import okhttp3.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;

@Service
@Slf4j
public class WhatsAppService {

    @Value("${whatsapp.service.url}")
    private String whatsappUrl;

    @Autowired
    private MensajeEnviadoService mensajeEnviadoService;

    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

public boolean enviarMensaje(Long socioId, String numeroTelefono, String mensaje) {
    try {
        log.info("📤 Enviando mensaje a {}", numeroTelefono);

        MediaType JSON = MediaType.get("application/json; charset=utf-8");

        // 🔥 CORREGIDO → El campo debe ser "numero", no "numeroTelefono"
        String json = String.format(
                "{\"numero\":\"%s\", \"mensaje\":\"%s\"}",
                numeroTelefono,
                mensaje.replace("\"", "'") // evita romper JSON si hay comillas
        );

        RequestBody body = RequestBody.create(json, JSON);

        Request req = new Request.Builder()
                .url(whatsappUrl + "/enviar-mensaje")
                .post(body)
                .build();

        Response res = client.newCall(req).execute();
        String responseBody = res.body() != null ? res.body().string() : "sin respuesta";

        log.info("📩 Respuesta WhatsApp: {} - {}", res.code(), responseBody);
        
        boolean ok = res.isSuccessful();

        // guardar registro
        MensajeEnviado registro = new MensajeEnviado();
        registro.setSocioId(socioId);
        registro.setNumeroTelefono(numeroTelefono);
        registro.setMensaje(mensaje);
        registro.setFechaEnvio(LocalDateTime.now());
        registro.setEstado(ok ? "ENVIADO" : "ERROR");
        mensajeEnviadoService.guardar(registro);

        return ok;

    } catch (Exception e) {
        log.error("❌ Error enviando mensaje: {}", e.getMessage());
        return false;
    }
}

}
