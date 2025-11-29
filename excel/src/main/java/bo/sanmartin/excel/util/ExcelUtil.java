package bo.sanmartin.excel.util;

import bo.sanmartin.excel.dto.SocioExcelDto;
import org.apache.poi.ss.usermodel.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class ExcelUtil {

    public static List<SocioExcelDto> leerSociosDesdeExcel(MultipartFile file) throws Exception {

        List<SocioExcelDto> socios = new ArrayList<>();

        InputStream is = file.getInputStream();
        Workbook workbook = WorkbookFactory.create(is);

        Sheet sheet = workbook.getSheetAt(0);

        for (Row row : sheet) {

            if (row.getRowNum() == 0) continue; // Saltar encabezado

            SocioExcelDto socio = new SocioExcelDto();

            socio.setNumeroSocio(row.getCell(0).toString());
            socio.setNombre(row.getCell(1).toString());
            socio.setNumeroTelefono(row.getCell(2).toString());

            socios.add(socio);
        }

        workbook.close();
        return socios;
    }
}
