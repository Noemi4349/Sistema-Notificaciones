package bo.sanmartin.creditos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "socios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Socio {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Boolean estado = false;
    
    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false)
    private String nombre;
    
    @NotBlank(message = "El apellido paterno es obligatorio")
    @Column(name = "apellido_paterno", nullable = false)
    private String apellidoPaterno;
    
    @Column(name = "apellido_materno")
    private String apellidoMaterno;
    
    @Email(message = "El email debe ser válido")
    @NotBlank(message = "El email es obligatorio")
    @Column(nullable = false, unique = true)
    private String email;
    
    @NotNull(message = "La fecha de vencimiento es obligatoria")
    @Column(name = "fecha_vencimiento_pago", nullable = false)
    private LocalDate fechaVencimientoPago;
    
    @NotBlank(message = "El número de socio es obligatorio")
    @Column(name = "numero_socio", nullable = false, unique = true)
    private String numeroSocio;
    
    @NotBlank(message = "El teléfono es obligatorio")
    @Column(nullable = false)
    private String telefono;
    
    @OneToMany(mappedBy = "socio", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RegistroEnvio> registrosEnvio = new ArrayList<>();
    
    // Método helper para obtener nombre completo
    public String getNombreCompleto() {
        StringBuilder nombreCompleto = new StringBuilder(nombre)
            .append(" ")
            .append(apellidoPaterno);
        
        if (apellidoMaterno != null && !apellidoMaterno.isEmpty()) {
            nombreCompleto.append(" ").append(apellidoMaterno);
        }
        
        return nombreCompleto.toString();
    }
    
    @PrePersist
    protected void onCreate() {
        if (estado == null) {
            estado = false;
        }
    }
}