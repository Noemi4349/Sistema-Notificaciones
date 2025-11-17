package bo.sanmartin.creditos.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroEnvioDTO {
    private Long id;
    private Long socioId;
    private String nombreSocio;
    private String fechaEnvio;
    private String numeroDestino;
    private String mensaje;
    private String estado;
    private String mensajeError;
    private String idExterno;
}