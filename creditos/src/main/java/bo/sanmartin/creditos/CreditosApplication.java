package bo.sanmartin.creditos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling  // ← IMPORTANTE: Habilita las tareas programadas
public class CreditosApplication {

    public static void main(String[] args) {
        SpringApplication.run(CreditosApplication.class, args);
        
        System.out.println("\n╔════════════════════════════════════════════════╗");
        System.out.println("║   🚀 Sistema de Créditos Iniciado             ║");
        System.out.println("╚════════════════════════════════════════════════╝");
        System.out.println("\n📋 Características:");
        System.out.println("   ✅ Gestión de socios");
        System.out.println("   ✅ Recordatorios automáticos por WhatsApp");
        System.out.println("   ✅ Scheduler programado (diario a las 9:00 AM)");
        System.out.println("\n⚠️  IMPORTANTE:");
        System.out.println("   1. Asegúrate de tener el servicio WhatsApp corriendo");
        System.out.println("   2. Escanea el QR en: http://localhost:3000/qr");
        System.out.println("   3. API REST disponible en: http://localhost:8080\n");
    }
}