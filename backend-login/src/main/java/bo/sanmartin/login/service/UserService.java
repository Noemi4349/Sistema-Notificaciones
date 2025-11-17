package bo.sanmartin.login.service;

import bo.sanmartin.login.dto.UserCreateDto;
import bo.sanmartin.login.dto.UserUpdateDto;
import bo.sanmartin.login.model.User;
import bo.sanmartin.login.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    // 🔹 GET: todos los usuarios
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 🔹 GET: usuario por ID
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
    }

    // 🔹 POST: crear usuario
    @Transactional
    public User createUser(UserCreateDto userRequest) {
        if (userRepository.existsByEmail(userRequest.getEmail())) {
            throw new RuntimeException("El correo electrónico ya está en uso");
        }

        if (userRepository.existsByUsername(userRequest.getUsername())) {
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }

        User newUser = User.builder()
                .nombre(userRequest.getNombre())
                .apellidoPaterno(userRequest.getApellidoPaterno())
                .apellidoMaterno(userRequest.getApellidoMaterno())
                .email(userRequest.getEmail())
                .username(userRequest.getUsername())
                .password(passwordEncoder.encode(userRequest.getPassword()))
                .estado(true) // por defecto activo
                .build();

        return userRepository.save(newUser);
    }

    // 🔹 PUT: actualizar usuario
    @Transactional
    public User updateUser(Long id, UserUpdateDto userRequest) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        userRepository.findByEmail(userRequest.getEmail())
                .filter(user -> !user.getId().equals(id))
                .ifPresent(user -> {
                    throw new RuntimeException("El correo electrónico ya está en uso");
                });

        userRepository.findByUsername(userRequest.getUsername())
                .filter(user -> !user.getId().equals(id))
                .ifPresent(user -> {
                    throw new RuntimeException("El nombre de usuario ya está en uso");
                });

        existingUser.setNombre(userRequest.getNombre());
        existingUser.setApellidoPaterno(userRequest.getApellidoPaterno());
        existingUser.setApellidoMaterno(userRequest.getApellidoMaterno());
        existingUser.setEmail(userRequest.getEmail());
        existingUser.setUsername(userRequest.getUsername());

        if (userRequest.getPassword() != null && !userRequest.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        }

        return userRepository.save(existingUser);
    }

    // 🔹 DELETE: borrado lógico (desactivar usuario)
    @Transactional
    public void deleteUser(Long id) {
        //User currentUser = authService.getCurrentUser();
        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        //if (currentUser.getId().equals(userToDelete.getId())) {
         //   throw new AccessDeniedException("No puedes eliminar tu propia cuenta");
        //}

        userToDelete.setEstado(false);
        userRepository.save(userToDelete);
    }

    // 🔹 DELETE: borrado permanente
    @Transactional
    public void deleteUserPermanently(Long id) {
        //User currentUser = authService.getCurrentUser();
        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

       /* if (currentUser.getId().equals(userToDelete.getId())) {
            throw new AccessDeniedException("No puedes eliminar tu propia cuenta");
        }*/

        userRepository.deleteById(id);
    }

    // 🔹 PATCH: activar usuario
    @Transactional
    public User activateUser(Long id) {
        User userToActivate = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        userToActivate.setEstado(true);
        return userRepository.save(userToActivate);
    }
    
    // 🔹 PATCH: actualizar parcialmente usuario
@Transactional
public User updateUserPartial(Long id, UserUpdateDto userUpdateDto) {
    User existingUser = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

    // Solo actualizamos los campos que no vienen nulos o vacíos
    if (userUpdateDto.getNombre() != null) {
        existingUser.setNombre(userUpdateDto.getNombre());
    }

    if (userUpdateDto.getApellidoPaterno() != null) {
        existingUser.setApellidoPaterno(userUpdateDto.getApellidoPaterno());
    }

    if (userUpdateDto.getApellidoMaterno() != null) {
        existingUser.setApellidoMaterno(userUpdateDto.getApellidoMaterno());
    }

    if (userUpdateDto.getEmail() != null) {
        // Verificamos que no exista otro usuario con el mismo correo
        userRepository.findByEmail(userUpdateDto.getEmail())
                .filter(user -> !user.getId().equals(id))
                .ifPresent(user -> {
                    throw new RuntimeException("El correo electrónico ya está en uso");
                });
        existingUser.setEmail(userUpdateDto.getEmail());
    }

    if (userUpdateDto.getUsername() != null) {
        // Verificamos que no exista otro usuario con el mismo username
        userRepository.findByUsername(userUpdateDto.getUsername())
                .filter(user -> !user.getId().equals(id))
                .ifPresent(user -> {
                    throw new RuntimeException("El nombre de usuario ya está en uso");
                });
        existingUser.setUsername(userUpdateDto.getUsername());
    }

    if (userUpdateDto.getPassword() != null && !userUpdateDto.getPassword().isEmpty()) {
        existingUser.setPassword(passwordEncoder.encode(userUpdateDto.getPassword()));
    }

    if (userUpdateDto.getEstado() != null) {
        existingUser.setEstado(userUpdateDto.getEstado());
    }

    return userRepository.save(existingUser);
}

}

