package bo.sanmartin.login.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserUpdateDto {
    @NotBlank private String nombre;
    private String apellidoPaterno;
    private String apellidoMaterno;
    @NotBlank @Email private String email;
    @NotBlank @Size(min = 3, max = 20) private String username;
    private String password;
    private Boolean estado;
}