package bo.sanmartin.creditos.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EstadisticasDiaDTO {
    private String fecha;
    private long total;
    private long exitosos;
    private long fallidos;
    private long pendientes;
}
