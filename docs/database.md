# Esquema de Base de Datos - Xignis App

Este documento define la estructura relacional para la gestión de permisos. Está diseñado pensando en PostgreSQL, aprovechando UUIDs y tipos de datos nativos como JSONB.

## 1. Diagrama de Tablas (DBML)

```dbml
Table users {
  id uuid [pk, default: `gen_random_uuid()`] // Mapeado a auth.users en la plataforma
  email varchar [unique, not null]
  full_name varchar [not null]
  job_title varchar
  role user_role [default: 'employee']
  manager_id uuid [ref: > users.id] // Auto-referencia para jerarquía
  created_at timestamptz [default: `now()`]
}

Table leave_requests {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [ref: > users.id, not null]
  reviewer_id uuid [ref: > users.id] // Quién aprobó/rechazó
  leave_type varchar [not null] // Ej: 'enfermedad', 'vacaciones', 'personal'
  start_date date [not null]
  end_date date [not null]
  schedule_details varchar // Ej: 'jornada_completa', '09:00-13:00'
  pending_tasks jsonb // Array de tareas [{"task": "Enviar reporte", "status": "pending"}]
  status request_status [default: 'pending']
  created_at timestamptz [default: `now()`]
  updated_at timestamptz [default: `now()`]
}
