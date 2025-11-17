package bo.sanmartin.creditos.repository;

import bo.sanmartin.creditos.model.RegistroEnvio;
import bo.sanmartin.creditos.model.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RegistroEnvioRepository extends JpaRepository<RegistroEnvio, Long> {
    
    List<RegistroEnvio> findBySocio(Socio socio);
    
    List<RegistroEnvio> findByEstado(RegistroEnvio.EstadoEnvio estado);
    
    @Query("SELECT r FROM RegistroEnvio r WHERE r.socio.id = :socioId ORDER BY r.fechaEnvio DESC")
    List<RegistroEnvio> findBySocioIdOrderByFechaEnvioDesc(@Param("socioId") Long socioId);
    
    /**
     * Verifica si ya se envió un mensaje a un socio para una fecha de vencimiento específica
     */
    @Query("SELECT COUNT(r) > 0 FROM RegistroEnvio r WHERE r.socio.id = :socioId " +
           "AND DATE(r.fechaVencimientoReferencia) = DATE(:fechaVencimiento) " +
           "AND r.estado = 'EXITOSO'")
    boolean existeEnvioExitosoParaFecha(
        @Param("socioId") Long socioId, 
        @Param("fechaVencimiento") LocalDateTime fechaVencimiento
    );
    
    @Query("SELECT r FROM RegistroEnvio r WHERE r.fechaEnvio BETWEEN :inicio AND :fin")
    List<RegistroEnvio> findByFechaEnvioBetween(
        @Param("inicio") LocalDateTime inicio, 
        @Param("fin") LocalDateTime fin
    );
}