package bo.sanmartin.login.controller;

import bo.sanmartin.login.dto.UserCreateDto;
import bo.sanmartin.login.dto.UserUpdateDto;
import bo.sanmartin.login.model.User;
import bo.sanmartin.login.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.net.URI;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET todos
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // GET por ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // POST - Crear usuario********
    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody UserCreateDto userCreate) {
        User createdUser = userService.createUser(userCreate);
        return ResponseEntity.created(URI.create("/api/users/" + createdUser.getId())).body(createdUser);
    }

    // PUT - Actualizar usuario
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateDto userUpdate) {
        return ResponseEntity.ok(userService.updateUser(id, userUpdate));
    }

    // DELETE - Desactivar (lógico)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build(); // 204
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(
                    Map.of("error", e.getMessage())
            );
        }
    }

    // DELETE - Permanente
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> deleteUserPermanently(@PathVariable Long id) {
        try {
            userService.deleteUserPermanently(id);
            return ResponseEntity.noContent().build(); // 204
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(
                    Map.of("error", e.getMessage())
            );
        }
    }

    // PATCH - Activar usuario
    @PatchMapping("/{id}/activate")
    public ResponseEntity<User> activateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.activateUser(id));
    }
    
    // PATCH - Actualizar parcialmente un usuario
     @PatchMapping("/{id}")
     public ResponseEntity<User> updateUserPartial(
            @PathVariable Long id,
            @RequestBody UserUpdateDto userUpdateDto) {
        return ResponseEntity.ok(userService.updateUserPartial(id, userUpdateDto));
    }
}