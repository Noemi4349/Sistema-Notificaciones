package bo.sanmartin.creditos.repository;

import bo.sanmartin.creditos.model.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SocioRepository extends JpaRepository<Socio, Long> {
    
    Optional<Socio> findByNumeroSocio(String numeroSocio);
    
    Optional<Socio> findByEmail(String email);
    
    List<Socio> findByEstado(Boolean estado);
    
    /**
     * Encuentra socios cuya fecha de vencimiento coincida con la fecha proporcionada
     * y que tengan préstamos activos (estado = true)
     */
    @Query("SELECT s FROM Socio s WHERE s.fechaVencimientoPago = :fecha AND s.estado = true")
    List<Socio> findByFechaVencimientoPagoAndEstadoTrue(@Param("fecha") LocalDate fecha);
    
    /**
     * Encuentra socios con fecha de vencimiento entre dos fechas
     */
    @Query("SELECT s FROM Socio s WHERE s.fechaVencimientoPago BETWEEN :fechaInicio AND :fechaFin AND s.estado = true")
    List<Socio> findSociosConVencimientoProximo(
        @Param("fechaInicio") LocalDate fechaInicio, 
        @Param("fechaFin") LocalDate fechaFin
    );
}