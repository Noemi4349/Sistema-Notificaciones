package bo.sanmartin.creditos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "registros_envio")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroEnvio {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id", nullable = false)
    private Socio socio;
    
    @Column(name = "fecha_envio", nullable = false)
    private LocalDateTime fechaEnvio;
    
    @Column(name = "numero_destino", nullable = false)
    private String numeroDestino;
    
    @Column(columnDefinition = "TEXT")
    private String mensaje;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoEnvio estado;
    
    @Column(name = "mensaje_error", columnDefinition = "TEXT")
    private String mensajeError;
    
    @Column(name = "id_externo")
    private String idExterno; // ID del mensaje en la API de WhatsApp
    
    @Column(name = "fecha_vencimiento_referencia")
    private LocalDateTime fechaVencimientoReferencia;
    
    public enum EstadoEnvio {
        EXITOSO,
        FALLIDO,
        PENDIENTE
    }
    
    @PrePersist
    protected void onCreate() {
        if (fechaEnvio == null) {
            fechaEnvio = LocalDateTime.now();
        }
        if (estado == null) {
            estado = EstadoEnvio.PENDIENTE;
        }
    }
}