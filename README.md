# Proyecto: Registro de participantes para un taller

## Objetivo
Aplicación web para que una universidad registre a los participantes de un taller de Desarrollo Web. El formulario pide nombre completo, correo, teléfono, taller y horario; envía los datos a una API hecha con Express y muestra la lista de inscritos sin recargar la página. Los registros se guardan en memoria mientras el servidor está encendido.

## Requisitos
- Node.js 18 o superior (se recomienda LTS) y Visual Studio Code.
- Conexión a internet la primera vez para instalar Express.

## Ejecutar en VS Code
1. Abre esta carpeta con **File → Open Folder**.
2. Abre **Terminal → New Terminal**.
3. Ejecuta `npm install`.
4. Ejecuta `npm start`.
5. Abre `http://localhost:3000`.

### Si PowerShell bloquea npm.ps1
Si aparece un mensaje que dice que la ejecución de scripts está deshabilitada, usa estos comandos en la misma terminal:

```powershell
npm.cmd install
npm.cmd start
```

También puedes cambiar el perfil de la terminal de VS Code a **Command Prompt** y usar los comandos `npm install` y `npm start`.

Los registros se guardan temporalmente en memoria y se borran al detener Node (`Ctrl+C`).

## API
| Método y ruta | Qué hace |
|---|---|
| `GET /api/inscripciones` | Devuelve el arreglo de inscripciones en JSON. Al inicio es `[]`. |
| `POST /api/inscripciones` | Recibe `{ nombre, correo, telefono, taller, horario }`. Si todo es válido responde `201` con el registro creado (incluye `id`). Si falta un dato, el correo no es válido o no hay cupo, responde `400` con un mensaje. |
| `DELETE /api/inscripciones/:id` | Elimina la inscripción con ese `id` y responde con un mensaje. Si no existe, responde `404`. |

## Probar la API
- **GET:** con el servidor encendido, abre `http://localhost:3000/api/inscripciones` en el navegador.
- **POST:** llena el formulario de `http://localhost:3000` y presiona **Registrar inscripción**. También desde PowerShell:
  ```powershell
  Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/inscripciones -ContentType "application/json" -Body '{"nombre":"Ana Lopez","correo":"ana@ejemplo.com","telefono":"5555 1234","taller":"JavaScript","horario":"Viernes, 18:00 a 21:00"}'
  ```
- **DELETE:** presiona **Quitar** junto a un participante de la lista, o desde PowerShell:
  ```powershell
  Invoke-RestMethod -Method Delete -Uri http://localhost:3000/api/inscripciones/1
  ```

## Entrega en GitHub
Sube el código fuente, `README.md` y `bitacora.md`. Completa al menos tres commits descriptivos y comparte el enlace del repositorio. No subas `node_modules/` ni archivos `.env`; ya están excluidos en `.gitignore`.
