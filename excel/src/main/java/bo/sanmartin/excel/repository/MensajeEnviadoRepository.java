package bo.sanmartin.excel.repository;

import bo.sanmartin.excel.entity.MensajeEnviado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensajeEnviadoRepository extends JpaRepository<MensajeEnviado, Long> {

    List<MensajeEnviado> findBySocioId(Long socioId);

    // 🟢 Historial general ordenado (el más reciente primero)
    List<MensajeEnviado> findAllByOrderByFechaEnvioDesc();
}
