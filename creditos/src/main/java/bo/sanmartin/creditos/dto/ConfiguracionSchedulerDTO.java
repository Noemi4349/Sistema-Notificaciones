package bo.sanmartin.creditos.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionSchedulerDTO {
    private Long id;
    private Integer hora;
    private Integer minuto;
    private Boolean activo;
    private String horaFormateada; // Ej: "09:30"
    private String expresionCron;
    private Integer diasAnticipacion;
    private String ultimaModificacion;
    private String modificadoPor;
}