package bo.sanmartin.excel.dto;

import java.util.List;

public class MensajeExcelRequestDto {

    private String mensaje;
    private List<SocioExcelDto> socios;

    public MensajeExcelRequestDto() {}

    public MensajeExcelRequestDto(String mensaje, List<SocioExcelDto> socios) {
        this.mensaje = mensaje;
        this.socios = socios;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public List<SocioExcelDto> getSocios() {
        return socios;
    }

    public void setSocios(List<SocioExcelDto> socios) {
        this.socios = socios;
    }
}
