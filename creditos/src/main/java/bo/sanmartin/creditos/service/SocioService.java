package bo.sanmartin.creditos.service;

import bo.sanmartin.creditos.model.Socio;
import bo.sanmartin.creditos.repository.SocioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocioService {
    
    private final SocioRepository socioRepository;
    
    @Transactional
    public Socio registrarSocio(Socio socio) {
        log.info("Registrando nuevo socio: {}", socio.getNombreCompleto());
        
        // Validar que no exista el número de socio
        if (socioRepository.findByNumeroSocio(socio.getNumeroSocio()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un socio con el número: " + socio.getNumeroSocio());
        }
        
        // Validar que no exista el email
        if (socioRepository.findByEmail(socio.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un socio con el email: " + socio.getEmail());
        }
        
        return socioRepository.save(socio);
    }
    
    @Transactional
    public Socio actualizarSocio(Long id, Socio socioActualizado) {
        Socio socioExistente = socioRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado con ID: " + id));
        
        socioExistente.setNombre(socioActualizado.getNombre());
        socioExistente.setApellidoPaterno(socioActualizado.getApellidoPaterno());
        socioExistente.setApellidoMaterno(socioActualizado.getApellidoMaterno());
        socioExistente.setEmail(socioActualizado.getEmail());
        socioExistente.setTelefono(socioActualizado.getTelefono());
        socioExistente.setEstado(socioActualizado.getEstado());
        socioExistente.setFechaVencimientoPago(socioActualizado.getFechaVencimientoPago());
        
        log.info("Actualizando socio: {}", socioExistente.getNombreCompleto());
        return socioRepository.save(socioExistente);
    }
    
    @Transactional
    public void cambiarEstadoSocio(Long id, Boolean nuevoEstado) {
        Socio socio = socioRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado con ID: " + id));
        
        socio.setEstado(nuevoEstado);
        socioRepository.save(socio);
        
        log.info("Estado del socio {} cambiado a: {}", socio.getNombreCompleto(), nuevoEstado);
    }
    
    public List<Socio> obtenerTodosLosSocios() {
        return socioRepository.findAll();
    }
    
    public Optional<Socio> obtenerSocioPorId(Long id) {
        return socioRepository.findById(id);
    }
    
    public Optional<Socio> obtenerSocioPorNumero(String numeroSocio) {
        return socioRepository.findByNumeroSocio(numeroSocio);
    }
    
    public List<Socio> obtenerSociosActivos() {
        return socioRepository.findByEstado(true);
    }
    
    public List<Socio> obtenerSociosConVencimientoManana() {
        LocalDate manana = LocalDate.now().plusDays(1);
        return socioRepository.findByFechaVencimientoPagoAndEstadoTrue(manana);
    }
    
    @Transactional
    public void eliminarSocio(Long id) {
        if (!socioRepository.existsById(id)) {
            throw new IllegalArgumentException("Socio no encontrado con ID: " + id);
        }
        socioRepository.deleteById(id);
        log.info("Socio eliminado con ID: {}", id);
    }
}
