package bo.sanmartin.creditos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "configuracion_scheduler")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionScheduler {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Integer hora = 9; // Hora del día (0-23)
    
    @Column(nullable = false)
    private Integer minuto = 0; // Minuto (0-59)
    
    @Column(nullable = false)
    private Boolean activo = true; // Si el scheduler está activo
    
    @Column(name = "ultima_modificacion")
    private LocalDateTime ultimaModificacion;
    
    @Column(name = "modificado_por")
    private String modificadoPor; // Usuario que modificó
    
    @Column(name = "dias_anticipacion")
    private Integer diasAnticipacion = 1; // Cuántos días antes enviar (por defecto 1 día)
    
    @PreUpdate
    protected void onUpdate() {
        ultimaModificacion = LocalDateTime.now();
    }
    
    @PrePersist
    protected void onCreate() {
        if (ultimaModificacion == null) {
            ultimaModificacion = LocalDateTime.now();
        }
    }
    
    /**
     * Genera la expresión cron a partir de hora y minuto
     */
    public String generarExpresionCron() {
        // Formato: segundo minuto hora día mes día-semana
        return String.format("0 %d %d * * *", minuto, hora);
    }
    
    /**
     * Obtiene la hora formateada para mostrar
     */
    public String getHoraFormateada() {
        return String.format("%02d:%02d", hora, minuto);
    }
}