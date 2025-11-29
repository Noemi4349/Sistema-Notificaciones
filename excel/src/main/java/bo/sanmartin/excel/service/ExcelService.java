package bo.sanmartin.excel.service;

import bo.sanmartin.excel.dto.SocioExcelDto;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Slf4j
@Service
public class ExcelService {

    public List<SocioExcelDto> leerExcel(MultipartFile file) {
        List<SocioExcelDto> socios = new ArrayList<>();

        try {
            InputStream inputStream = file.getInputStream();
            Workbook workbook = new XSSFWorkbook(inputStream);
            Sheet sheet = workbook.getSheetAt(0);

            Iterator<Row> rows = sheet.iterator();

            // 👉 Saltar encabezado
            if (rows.hasNext()) {
                rows.next();
            }

            while (rows.hasNext()) {
                Row row = rows.next();
                SocioExcelDto socio = new SocioExcelDto();

                // 📌 Columnas del archivo Excel
                Cell numSocio = row.getCell(0);
                Cell nombre = row.getCell(1);
                Cell telefono = row.getCell(2);

                socio.setNumeroSocio(getString(numSocio));
                socio.setNombre(getString(nombre));

                // 🔥 Validación completa del número
                String numeroValidado = validarTelefono(getString(telefono));
                socio.setNumeroTelefono(numeroValidado);

                socios.add(socio);
            }

            workbook.close();

        } catch (Exception e) {
            throw new RuntimeException("Error leyendo Excel: " + e.getMessage());
        }

        return socios;
    }
    

    // ---------------------------
    // Convertir celda → String
    // ---------------------------
    private String getString(Cell cell) {
        if (cell == null) return "";

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();

            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());

            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());

            default:
                return "";
        }
    }

    // ---------------------------
    // VALIDACIÓN DE NÚMERO
    // ---------------------------
    private String validarTelefono(String numero) {
        if (numero == null) return "";

        // 1️⃣ Eliminar espacios, guiones, paréntesis
        numero = numero.replaceAll("[^0-9]", "");

        // 2️⃣ Si queda vacío → no válido
        if (numero.isEmpty()) return "";

        // 3️⃣ Debe tener 8 dígitos en Bolivia
        if (numero.length() != 8) {
            log.warn("⚠️ Número inválido encontrado: {}", numero);
            return ""; // evita enviar
        }

        // 4️⃣ Agregar +591 automáticamente
        return "+591" + numero;
    }
}
