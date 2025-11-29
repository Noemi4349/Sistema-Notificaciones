package bo.sanmartin.excel.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mensajes_enviados")
public class MensajeEnviado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long socioId;

    private String numeroTelefono;

    @Column(columnDefinition = "TEXT")
    private String mensaje;

    private LocalDateTime fechaEnvio;

    private String estado; // ENVIADO o ERROR

    public MensajeEnviado() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSocioId() { return socioId; }
    public void setSocioId(Long socioId) { this.socioId = socioId; }

    public String getNumeroTelefono() { return numeroTelefono; }
    public void setNumeroTelefono(String numeroTelefono) { this.numeroTelefono = numeroTelefono; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public LocalDateTime getFechaEnvio() { return fechaEnvio; }
    public void setFechaEnvio(LocalDateTime fechaEnvio) { this.fechaEnvio = fechaEnvio; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
