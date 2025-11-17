// config/SchedulerConfig.java
package bo.sanmartin.login.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulerConfig {
    // ⚡ HABILITA que tu sistema se ejecute AUTOMÁTICAMENTE todos los días
    // Sin esto, tendrías que ejecutar manualmente cada día
}