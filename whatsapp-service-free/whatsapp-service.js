// whatsapp-service.js - OPTIMIZADO con auto-QR y limpieza de memoria
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());

let sock;
let qrCodeData = null;
let isConnected = false;
let isConnecting = false;
let intentosReconexion = 0;
const MAX_INTENTOS = 3;

// Configuración
const PORT = 3000;
const AUTH_PATH = path.join(__dirname, 'auth_info_baileys');

// Logger silencioso
const logger = pino({ level: 'silent' });

// ========================================
// FUNCIONES DE LIMPIEZA DE MEMORIA
// ========================================

// Limpiar carpeta de autenticación
function limpiarSesion() {
    try {
        if (fs.existsSync(AUTH_PATH)) {
            const archivos = fs.readdirSync(AUTH_PATH);
            console.log(`🧹 Limpiando ${archivos.length} archivos de sesión...`);
            
            fs.rmSync(AUTH_PATH, { recursive: true, force: true });
            console.log('✅ Sesión eliminada correctamente');
            return true;
        }
    } catch (error) {
        console.error('❌ Error al limpiar sesión:', error.message);
        return false;
    }
}

// Obtener tamaño de carpeta
function obtenerTamañoCarpeta(carpeta) {
    try {
        if (!fs.existsSync(carpeta)) return 0;
        
        let tamaño = 0;
        const archivos = fs.readdirSync(carpeta);
        
        archivos.forEach(archivo => {
            const rutaCompleta = path.join(carpeta, archivo);
            const stats = fs.statSync(rutaCompleta);
            
            if (stats.isDirectory()) {
                tamaño += obtenerTamañoCarpeta(rutaCompleta);
            } else {
                tamaño += stats.size;
            }
        });
        
        return tamaño;
    } catch (error) {
        return 0;
    }
}

// Convertir bytes a formato legible
function formatearTamaño(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Limpiar archivos temporales viejos
function limpiarArchivosTemporales() {
    try {
        const carpetasTemp = [
            path.join(__dirname, 'temp'),
            path.join(__dirname, '.wwebjs_cache'),
            path.join(__dirname, '.wwebjs_auth')
        ];
        
        let archivosEliminados = 0;
        
        carpetasTemp.forEach(carpeta => {
            if (fs.existsSync(carpeta)) {
                const tamaño = obtenerTamañoCarpeta(carpeta);
                console.log(`🗑️ Eliminando ${carpeta} (${formatearTamaño(tamaño)})`);
                fs.rmSync(carpeta, { recursive: true, force: true });
                archivosEliminados++;
            }
        });
        
        if (archivosEliminados > 0) {
            console.log(`✅ ${archivosEliminados} carpetas temporales eliminadas`);
        }
    } catch (error) {
        console.error('❌ Error al limpiar temporales:', error.message);
    }
}

// Limpieza automática cada 6 horas
cron.schedule('0 */6 * * *', () => {
    console.log('\n🕐 Ejecutando limpieza programada...');
    const tamaño = obtenerTamañoCarpeta(AUTH_PATH);
    console.log(`📊 Tamaño actual de sesión: ${formatearTamaño(tamaño)}`);
    
    limpiarArchivosTemporales();
    
    // Si la carpeta de sesión es muy grande (>50MB), limpiar
    if (tamaño > 50 * 1024 * 1024) {
        console.log('⚠️ Carpeta de sesión muy grande, limpiando...');
        if (!isConnected) {
            limpiarSesion();
        }
    }
});

// ========================================
// FUNCIÓN PARA CONECTAR WHATSAPP
// ========================================

async function connectToWhatsApp(forzarQR = false) {
    if (isConnecting) {
        console.log('⏳ Ya hay una conexión en proceso...');
        return;
    }

    // Si forzamos nuevo QR, limpiar sesión
    if (forzarQR) {
        console.log('🔄 Forzando nuevo QR...');
        limpiarSesion();
        qrCodeData = null;
    }

    isConnecting = true;

    try {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
        const { version } = await fetchLatestBaileysVersion();
        
        sock = makeWASocket({
            auth: state,
            logger,
            browser: ['Sistema de Socios', 'Chrome', '1.0.0'],
            version,
            defaultQueryTimeoutMs: undefined,
            keepAliveIntervalMs: 30000,
            markOnlineOnConnect: true,
        });

        // Evento: QR Code
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                qrCodeData = qr;
                intentosReconexion = 0;
                console.log('\n✅ Código QR generado!');
                console.log('📱 Ve a: http://localhost:3000/qr\n');
            }

            if (connection === 'close') {
                isConnecting = false;
                isConnected = false;
                
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const razon = lastDisconnect?.error?.output?.payload?.error;
                
                console.log(`\n❌ Conexión cerrada`);
                console.log(`📊 Código: ${statusCode} | Razón: ${razon || 'Desconocida'}`);
                
                // Determinar acción según el código
                let shouldReconnect = false;
                let shouldClearAuth = false;
                
                switch(statusCode) {
                    case DisconnectReason.loggedOut:
                        console.log('🚪 Sesión cerrada desde el celular');
                        shouldClearAuth = true;
                        shouldReconnect = true;
                        break;
                        
                    case DisconnectReason.connectionClosed:
                    case DisconnectReason.connectionLost:
                        console.log('📡 Conexión perdida, reintentando...');
                        shouldReconnect = true;
                        break;
                        
                    case DisconnectReason.restartRequired:
                        console.log('🔄 Reinicio requerido');
                        shouldReconnect = true;
                        break;
                        
                    case DisconnectReason.timedOut:
                        console.log('⏱️ Tiempo de espera agotado');
                        shouldReconnect = true;
                        break;
                        
                    case DisconnectReason.badSession:
                        console.log('❌ Sesión corrupta, limpiando...');
                        shouldClearAuth = true;
                        shouldReconnect = true;
                        break;
                        
                    default:
                        console.log('❓ Desconexión inesperada');
                        shouldReconnect = true;
                }
                
                // Limpiar sesión si es necesario
                if (shouldClearAuth) {
                    console.log('🧹 Limpiando sesión antigua...');
                    limpiarSesion();
                    qrCodeData = null;
                    intentosReconexion = 0;
                }
                
                // Reconectar si es necesario
                if (shouldReconnect && intentosReconexion < MAX_INTENTOS) {
                    intentosReconexion++;
                    const delay = Math.min(3000 * intentosReconexion, 10000);
                    
                    console.log(`🔄 Reintento ${intentosReconexion}/${MAX_INTENTOS} en ${delay/1000}s...`);
                    
                    setTimeout(() => {
                        connectToWhatsApp(shouldClearAuth);
                    }, delay);
                } else if (intentosReconexion >= MAX_INTENTOS) {
                    console.log('⚠️ Máximo de reintentos alcanzado');
                    console.log('💡 Generando nuevo QR...');
                    intentosReconexion = 0;
                    setTimeout(() => connectToWhatsApp(true), 2000);
                }
                
            } else if (connection === 'open') {
                console.log('\n✅ WhatsApp conectado exitosamente!');
                console.log(`📱 Número: ${sock.user.id.split(':')[0]}`);
                isConnected = true;
                isConnecting = false;
                qrCodeData = null;
                intentosReconexion = 0;
                
                // Mostrar tamaño de sesión
                const tamaño = obtenerTamañoCarpeta(AUTH_PATH);
                console.log(`💾 Tamaño de sesión: ${formatearTamaño(tamaño)}\n`);
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // Evento: Mensajes (opcional)
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.key.fromMe && msg.message) {
                console.log('📩 Mensaje recibido:', msg.key.remoteJid);
            }
        });

    } catch (error) {
        isConnecting = false;
        console.error('❌ Error al conectar:', error.message);
        
        // Reintentar después de 5 segundos
        setTimeout(() => {
            console.log('🔄 Reintentando conexión...');
            connectToWhatsApp();
        }, 5000);
    }
}

// ========================================
// FUNCIÓN PARA ENVIAR MENSAJES
// ========================================

async function enviarMensaje(numero, mensaje) {
    if (!isConnected || !sock) {
        throw new Error('WhatsApp no está conectado. Por favor escanea el código QR en http://localhost:3000/qr');
    }

    let numeroFormateado = numero.replace(/[^0-9]/g, '');
    
    if (!numeroFormateado.startsWith('591')) {
        numeroFormateado = '591' + numeroFormateado;
    }
    
    const numeroWhatsApp = numeroFormateado + '@s.whatsapp.net';
    
    try {
        await sock.sendMessage(numeroWhatsApp, { text: mensaje });
        console.log(`✅ Mensaje enviado a ${numero}`);
        return {
            success: true,
            numeroDestino: numero,
            mensaje: 'Mensaje enviado correctamente'
        };
    } catch (error) {
        console.error(`❌ Error al enviar mensaje a ${numero}:`, error.message);
        throw error;
    }
}

// ========================================
// ENDPOINTS DE LA API
// ========================================

app.get('/', (req, res) => {
    const tamaño = obtenerTamañoCarpeta(AUTH_PATH);
    res.json({
        service: 'WhatsApp Service Optimizado',
        version: '3.0.0',
        connected: isConnected,
        connecting: isConnecting,
        sessionSize: formatearTamaño(tamaño),
        endpoints: {
            qr: 'GET /qr - Ver código QR',
            status: 'GET /status - Estado detallado',
            enviarMensaje: 'POST /enviar-mensaje - Enviar mensaje',
            reset: 'POST /reset - Resetear y generar nuevo QR',
            limpiar: 'POST /limpiar - Limpiar archivos temporales'
        }
    });
});

app.get('/qr', async (req, res) => {
    if (!qrCodeData) {
        return res.send(`
            <html>
                <head>
                    <title>WhatsApp QR Code</title>
                    <meta http-equiv="refresh" content="3">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 50px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            background: white;
                            padding: 30px;
                            border-radius: 15px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                            max-width: 500px;
                            margin: 0 auto;
                        }
                        h1 { color: #25D366; margin-bottom: 20px; }
                        .status { 
                            padding: 15px; 
                            border-radius: 10px;
                            margin: 20px 0;
                            font-size: 16px;
                        }
                        .connected { background: #d4edda; color: #155724; border: 2px solid #c3e6cb; }
                        .waiting { background: #fff3cd; color: #856404; border: 2px solid #ffeaa7; }
                        .connecting { background: #d1ecf1; color: #0c5460; border: 2px solid #bee5eb; }
                        .emoji { font-size: 48px; margin: 20px 0; }
                        .btn {
                            background: #25D366;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            margin-top: 15px;
                        }
                        .btn:hover { background: #128C7E; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>📱 WhatsApp Service</h1>
                        ${isConnected ? 
                            `<div class="emoji">✅</div>
                            <div class="status connected">
                                <strong>¡Conectado!</strong><br>
                                El servicio está listo para enviar mensajes
                            </div>
                            <button class="btn" onclick="location.href='/reset'">Generar Nuevo QR</button>` : 
                            isConnecting ?
                            '<div class="emoji">🔄</div><div class="status connecting"><strong>Conectando...</strong><br>Generando código QR</div>' :
                            '<div class="emoji">⏳</div><div class="status waiting"><strong>Esperando conexión</strong><br>Esta página se actualizará automáticamente</div>'
                        }
                        <div style="margin-top: 20px; color: #666; font-size: 14px;">
                            ${isConnected ? 'Servicio activo' : 'Actualizando cada 3 segundos...'}
                        </div>
                    </div>
                </body>
            </html>
        `);
    }

    try {
        const qrImage = await QRCode.toDataURL(qrCodeData);
        res.send(`
            <html>
                <head>
                    <title>Escanear QR - WhatsApp</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 50px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            background: white;
                            padding: 40px;
                            border-radius: 15px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                            max-width: 500px;
                            margin: 0 auto;
                        }
                        h1 { color: #25D366; margin-bottom: 10px; }
                        .subtitle { color: #666; margin-bottom: 30px; }
                        img { 
                            border: 3px solid #25D366; 
                            border-radius: 15px;
                            margin: 20px 0;
                            box-shadow: 0 5px 20px rgba(37, 211, 102, 0.3);
                        }
                        .instructions {
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 10px;
                            margin: 20px 0;
                            text-align: left;
                            border-left: 4px solid #25D366;
                        }
                        .instructions ol {
                            margin: 10px 0;
                            padding-left: 20px;
                        }
                        .instructions li {
                            margin: 10px 0;
                            line-height: 1.6;
                        }
                        .footer {
                            color: #666;
                            font-size: 14px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>📱 Escanear Código QR</h1>
                        <p class="subtitle">Vincula tu WhatsApp con el sistema</p>
                        <img src="${qrImage}" alt="QR Code" width="300" />
                        <div class="instructions">
                            <strong>📋 Instrucciones:</strong>
                            <ol>
                                <li>Abre <strong>WhatsApp</strong> en tu teléfono</li>
                                <li>Ve a <strong>Configuración</strong> ⚙️</li>
                                <li>Toca <strong>Dispositivos vinculados</strong> 📱</li>
                                <li>Toca <strong>Vincular un dispositivo</strong></li>
                                <li>Escanea este código QR</li>
                            </ol>
                        </div>
                        <p class="footer">⏱️ Se actualizará automáticamente al conectar</p>
                    </div>
                    <script>
                        setTimeout(() => window.location.reload(), 5000);
                    </script>
                </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Error generando QR: ' + error.message);
    }
});

app.get('/status', (req, res) => {
    const tamaño = obtenerTamañoCarpeta(AUTH_PATH);
    res.json({
        connected: isConnected,
        connecting: isConnecting,
        hasQR: qrCodeData !== null,
        sessionSize: formatearTamaño(tamaño),
        reconnectAttempts: intentosReconexion,
        phone: isConnected && sock ? sock.user.id.split(':')[0] : null,
        message: isConnected ? 'WhatsApp conectado' : isConnecting ? 'Conectando...' : 'No conectado'
    });
});

app.post('/enviar-mensaje', async (req, res) => {
    const { numero, mensaje } = req.body;

    if (!numero || !mensaje) {
        return res.status(400).json({
            success: false,
            error: 'Se requiere número y mensaje'
        });
    }

    try {
        const result = await enviarMensaje(numero, mensaje);
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            connected: isConnected
        });
    }
});

app.post('/reset', (req, res) => {
    console.log('🔄 Solicitando reset manual...');
    
    isConnected = false;
    qrCodeData = null;
    intentosReconexion = 0;
    
    limpiarSesion();
    
    setTimeout(() => {
        connectToWhatsApp(true);
    }, 1000);
    
    res.json({
        success: true,
        message: 'Sesión reseteada. Nuevo QR generándose en /qr'
    });
});

app.post('/limpiar', (req, res) => {
    console.log('🧹 Ejecutando limpieza manual...');
    limpiarArchivosTemporales();
    
    const tamaño = obtenerTamañoCarpeta(AUTH_PATH);
    
    res.json({
        success: true,
        message: 'Limpieza completada',
        sessionSize: formatearTamaño(tamaño)
    });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║   🚀 WhatsApp Service OPTIMIZADO v3.0                ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    console.log(`📡 Servidor: http://localhost:${PORT}`);
    console.log(`📱 Ver QR: http://localhost:${PORT}/qr`);
    console.log(`📊 Estado: http://localhost:${PORT}/status`);
    console.log(`🔄 Reset: POST http://localhost:${PORT}/reset`);
    console.log(`🧹 Limpiar: POST http://localhost:${PORT}/limpiar\n`);
    
    const tamaño = obtenerTamañoCarpeta(AUTH_PATH);
    console.log(`💾 Tamaño de sesión: ${formatearTamaño(tamaño)}`);
    console.log('⏳ Conectando a WhatsApp...\n');
    
    connectToWhatsApp();
});

process.on('SIGINT', async () => {
    console.log('\n\n👋 Cerrando servicio...');
    if (sock) {
        try {
            await sock.logout();
        } catch (e) {}
    }
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error.message);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Promesa rechazada:', error.message);
});