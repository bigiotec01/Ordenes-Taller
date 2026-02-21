# Pedidos Dealer v3.1.2

Sistema de control y seguimiento de ordenes de piezas para talleres automotrices y dealers. Permite registrar pedidos, darles seguimiento a traves de 7 estados, notificar a clientes por WhatsApp y sincronizar todo en la nube en tiempo real.

Pensado para ser usado desde el telefono como app instalable (PWA), ideal para managers o encargados de partes que necesitan tener visibilidad rapida del estatus de cada orden.

**Live:** https://ordenes-taller.vercel.app

## Funcionalidades

**Ordenes**
- Crear ordenes con taller, pedido, PO#, dia de pedido y dia de entrega
- 7 estados: Pendiente, Ordenado, Piezas en Tienda, En Transito, Listo para Recoger, Listo para Entrega, Entregado
- Cambiar estatus desde un dropdown en cada orden
- Editar y eliminar ordenes existentes
- Buscador en tiempo real por taller, pedido o PO
- Filtro rapido por estatus con chips visuales
- Contador de ordenes por estatus

**WhatsApp**
- Enviar actualizacion de pedido con un clic
- Mensaje incluye estatus, fechas y mensaje contextual por estado

**Sync en la nube**
- Firebase Firestore como base de datos
- Sync automatico entre dispositivos en tiempo real
- Funciona offline — sincroniza al reconectar
- Badge visual sync/offline debajo del titulo
- Migracion automatica de datos locales (localStorage) a Firestore

**Respaldo**
- Exportar ordenes como archivo JSON
- Importar respaldo con deduplicacion automatica

**PWA**
- Instalable en telefono como app nativa
- Service Worker con estrategia network-first
- Funciona sin internet

## Tech Stack

- HTML/CSS/JS vanilla (sin frameworks)
- Firebase Firestore (base de datos + sync)
- Vercel (hosting estatico)
- Service Worker (offline + cache)

## Setup

1. Clonar el repositorio
2. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
3. Habilitar Firestore Database (test mode o reglas personalizadas)
4. Actualizar `firebaseConfig` en `index.html` con tus credenciales
5. Deploy a Vercel o cualquier hosting estatico

## Estructura

```
index.html      → App completa (HTML + CSS + JS + Firebase)
manifest.json   → Configuracion PWA
sw.js           → Service Worker (cache + offline + push)
vercel.json     → Headers para Vercel
```

## Autor

**Ismael Bigio** | 2026
