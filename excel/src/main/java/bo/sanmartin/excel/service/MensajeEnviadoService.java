package bo.sanmartin.excel.service;

import bo.sanmartin.excel.entity.MensajeEnviado;
import bo.sanmartin.excel.repository.MensajeEnviadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MensajeEnviadoService {

    @Autowired
    private MensajeEnviadoRepository repository;

    public MensajeEnviado guardar(MensajeEnviado mensaje) {
        return repository.save(mensaje);
    }

    public java.util.List<MensajeEnviado> historialPorSocio(Long socioId) {
        return repository.findBySocioId(socioId);
    }

    public void guardar(String numero, String mensaje) {
    MensajeEnviado m = new MensajeEnviado();
    m.setNumeroTelefono(numero);
    m.setMensaje(mensaje);
    m.setFechaEnvio(LocalDateTime.now());
    m.setEstado("ENVIADO");
        m.setSocioId(null);
       
    repository.save(m);
}

public List<MensajeEnviado> listarTodos() {
    return repository.findAllByOrderByFechaEnvioDesc();
}


}
