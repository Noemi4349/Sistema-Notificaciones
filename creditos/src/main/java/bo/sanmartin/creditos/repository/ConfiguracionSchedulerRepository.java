package bo.sanmartin.creditos.repository;

import bo.sanmartin.creditos.model.ConfiguracionScheduler;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracionSchedulerRepository extends JpaRepository<ConfiguracionScheduler, Long> {
    
    /**
     * Obtiene la configuración activa (solo debe haber una)
     */
    @Query("SELECT c FROM ConfiguracionScheduler c ORDER BY c.id DESC")
    Optional<ConfiguracionScheduler> findConfiguracionActual();
    
    /**
     * Encuentra configuración por estado activo
     */
    Optional<ConfiguracionScheduler> findFirstByActivoTrue();
}