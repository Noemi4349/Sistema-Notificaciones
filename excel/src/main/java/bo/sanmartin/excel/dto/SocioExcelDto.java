package bo.sanmartin.excel.dto;

public class SocioExcelDto {

    private String numeroSocio;
    private String nombre;
    private String numeroTelefono;

    public SocioExcelDto() {}

    public SocioExcelDto(String numeroSocio, String nombre, String numeroTelefono) {
        this.numeroSocio = numeroSocio;
        this.nombre = nombre;
        this.numeroTelefono = numeroTelefono;
    }

    public String getNumeroSocio() {
        return numeroSocio;
    }

    public void setNumeroSocio(String numeroSocio) {
        this.numeroSocio = numeroSocio;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getNumeroTelefono() {
        return numeroTelefono;
    }

    public void setNumeroTelefono(String numeroTelefono) {
        this.numeroTelefono = numeroTelefono;
    }
}
