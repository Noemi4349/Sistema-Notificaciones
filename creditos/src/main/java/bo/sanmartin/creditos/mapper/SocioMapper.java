package bo.sanmartin.creditos.mapper;

import bo.sanmartin.creditos.dto.SocioDTO;
import bo.sanmartin.creditos.model.Socio;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class SocioMapper {
    
    public SocioDTO toDTO(Socio socio) {
        if (socio == null) {
            return null;
        }
        
        SocioDTO dto = new SocioDTO();
        dto.setId(socio.getId());
        dto.setNumeroSocio(socio.getNumeroSocio());
        dto.setNombre(socio.getNombre());
        dto.setApellidoPaterno(socio.getApellidoPaterno());
        dto.setApellidoMaterno(socio.getApellidoMaterno());
        dto.setEmail(socio.getEmail());
        dto.setTelefono(socio.getTelefono());
        dto.setFechaVencimientoPago(socio.getFechaVencimientoPago());
        dto.setEstado(socio.getEstado());
        
        return dto;
    }
    
    public List<SocioDTO> toDTOList(List<Socio> socios) {
        return socios.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
    
    public Socio toEntity(SocioDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Socio socio = new Socio();
        socio.setId(dto.getId());
        socio.setNumeroSocio(dto.getNumeroSocio());
        socio.setNombre(dto.getNombre());
        socio.setApellidoPaterno(dto.getApellidoPaterno());
        socio.setApellidoMaterno(dto.getApellidoMaterno());
        socio.setEmail(dto.getEmail());
        socio.setTelefono(dto.getTelefono());
        socio.setFechaVencimientoPago(dto.getFechaVencimientoPago());
        socio.setEstado(dto.getEstado());
        
        return socio;
    }
}