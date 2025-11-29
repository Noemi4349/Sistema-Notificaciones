package bo.sanmartin.excel.controller;

import bo.sanmartin.excel.entity.MensajeEnviado;
import bo.sanmartin.excel.service.MensajeEnviadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mensajes")
@CrossOrigin(origins = "*")
public class MensajeEnviadoController {

    @Autowired
    private MensajeEnviadoService service;

    // 🔹 Historial general
    @GetMapping("/historial")
    public List<MensajeEnviado> historialGeneral() {
        return service.listarTodos();
    }
    
    @GetMapping("/socio/{id}")
    public List<MensajeEnviado> historial(@PathVariable Long id) {
        return service.historialPorSocio(id);
    }
}
