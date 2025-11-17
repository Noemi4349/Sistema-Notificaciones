package bo.sanmartin.login.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "usuarios")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "usrid")
    private Long id;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "appaterno")
    private String apellidoPaterno;

    @Column(name = "apmaterno")
    private String apellidoMaterno;

    @Column(name = "correo", nullable = false, unique = true)
    private String email;

    @Column(name = "usuario", nullable = false, unique = true)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @CreationTimestamp
    @Column(name = "fechacrea", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fechamod", nullable = false)
    private LocalDateTime fechaModificacion;

    @Column(name = "estado", nullable = false)
    @Builder.Default  // ⭐ Agregar esto
    private Boolean estado = true;  // ⭐ Valor por defecto

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER")); // Por defecto
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return estado;
    }
}
