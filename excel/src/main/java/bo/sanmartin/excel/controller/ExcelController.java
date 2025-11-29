package bo.sanmartin.excel.controller;

import bo.sanmartin.excel.dto.SocioExcelDto;
import bo.sanmartin.excel.dto.MensajeRequest;
import bo.sanmartin.excel.dto.MensajeExcelRequestDto;
import bo.sanmartin.excel.service.ExcelService;
import bo.sanmartin.excel.service.WhatsAppService;
import bo.sanmartin.excel.service.MensajeEnviadoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/excel")
@CrossOrigin("*")
public class ExcelController {

    @Autowired
    private ExcelService excelService;

    @Autowired
    private WhatsAppService whatsAppService;

    @Autowired
    private MensajeEnviadoService mensajeEnviadoService;


    // 🔹 SOLO LEE EL EXCEL Y DEVUELVE LA LISTA
    @PostMapping("/leer")
    public ResponseEntity<?> leerExcel(@RequestParam("file") MultipartFile file) {
        try {
            List<SocioExcelDto> socios = excelService.leerExcel(file);
            return ResponseEntity.ok(socios);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error leyendo excel: " + e.getMessage());
        }
    }

    /// 🔹 Proceso completo pero SOLO devolviendo la lista (tu lógica actual)
    @PostMapping("/procesar")
    public ResponseEntity<List<SocioExcelDto>> procesarExcel(@RequestParam("file") MultipartFile file) {
        List<SocioExcelDto> socios = excelService.leerExcel(file);
        return ResponseEntity.ok(socios);
    }

     // 🔹 Enviar mensaje y guardar registro
    @PostMapping("/enviar")
    public ResponseEntity<?> enviarMensaje(@RequestBody MensajeRequest dto) {

        log.info("📲 Enviando mensaje a: {}", dto.getNumero());

        boolean enviado = whatsAppService.enviarMensaje(
        null,                      // socioId no lo estás usando, así que va null
        dto.getNumero(),
        dto.getMensaje()
);


        if (enviado) {
            mensajeEnviadoService.guardar(dto.getNumero(), dto.getMensaje());
            return ResponseEntity.ok("Mensaje enviado y guardado correctamente.");
        }

        return ResponseEntity.status(500).body("❌ Error al enviar el mensaje");
    }

    @PostMapping("/enviar-masivo")
public ResponseEntity<?> enviarMensajesMasivo(
        @RequestParam("file") MultipartFile file,
        @RequestParam("mensaje") String mensaje) {

    try {
        List<SocioExcelDto> socios = excelService.leerExcel(file);
        int enviados = 0;

        for (SocioExcelDto socio : socios) {
            String numero = socio.getNumeroTelefono();

            if (numero == null || numero.isEmpty()) {
                log.warn("Número inválido, saltando...");
                continue;
            }

            boolean ok = whatsAppService.enviarMensaje(
                    null,
                    numero,
                    mensaje
            );

            if (ok) {
                enviados++;
                mensajeEnviadoService.guardar(numero, mensaje);
            }
        }

        return ResponseEntity.ok("Mensajes enviados: " + enviados);

    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Error procesando Excel: " + e.getMessage());
    }
}

@PostMapping("/procesar-enviar")
public ResponseEntity<?> procesarYEnviar(
        @RequestParam("file") MultipartFile file,
        @RequestParam("mensaje") String mensaje) {

    try {
        log.info("📂 Procesando Excel y enviando mensajes...");

        // 1️⃣ Leer el Excel
        List<SocioExcelDto> socios = excelService.leerExcel(file);

        int enviados = 0;
        int fallidos = 0;

        // 2️⃣ Recorrer los socios
        for (SocioExcelDto socio : socios) {

            String telefono = socio.getNumeroTelefono();

            // Si viene vacío, lo saltamos
            if (telefono == null || telefono.isEmpty()) {
                fallidos++;
                continue;
            }

            log.info("📲 Enviando mensaje a: {}", telefono);

            boolean ok = whatsAppService.enviarMensaje(
                    null,           // socioId (no lo usas)
                    telefono,
                    mensaje
            );

            if (ok) {
                enviados++;
                mensajeEnviadoService.guardar(telefono, mensaje);
            } else {
                fallidos++;
            }
        }

        log.info("✔ Envíos completados. Enviados: {} - Fallidos: {}", enviados, fallidos);

        return ResponseEntity.ok(
                "Mensajes enviados: " + enviados +
                " | Fallidos: " + fallidos
        );

    } catch (Exception e) {
        log.error("❌ Error procesando Excel", e);
        return ResponseEntity.status(500)
                .body("Error procesando Excel: " + e.getMessage());
    }
}

}
