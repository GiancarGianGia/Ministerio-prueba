export type UserRole = 'Administrador' | 'Registrador' | 'Consulta';

export type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

export interface AppUser {
    id: string;
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    active: boolean;
    createdAt: string;
    createdBy: string;
    lastLogin?: string;
}

export interface NewUserInput {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    active: boolean;
}

export interface UpdateUserInput {
    fullName: string;
    email: string;
    role: UserRole;
    active: boolean;
    password?: string;
}

export interface Person {
    id: string;
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
    birthDate: string;
    gender: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    department: string;
    type: string;
    status: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export type NewPersonInput = Omit<Person, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

export interface ActivityLog {
    id: string;
    timestamp: string;
    action: string;
    description: string;
    actor: string;
    entityId?: string;
}

export interface AuthResult {
    ok: boolean;
    message: string;
}

export const STORAGE_KEYS = {
    users: 'registro.usuarios.v1',
    session: 'registro.sesion.v1',
    persons: 'registro.personas.v2',
    logs: 'registro.actividad.v2'
} as const;

export const USER_ROLES: UserRole[] = ['Administrador', 'Registrador', 'Consulta'];

export const DOCUMENT_TYPES = ['Cédula de identidad', 'Pasaporte', 'Cédula de extranjería', 'RIF'];

export const GENDERS = ['Femenino', 'Masculino', 'Otro', 'Prefiere no decir'];

export const PERSON_TYPES = [
    'Analista',
    'Asistente administrativo',
    'Supervisor',
    'Director',
    'Abogado',
    'Trabajador obrero',
    'Pasante',
    'Director de OTIC',
    'Coordinador de OTIC',
    'Jefe de Departamento TIC',
    'Jefe de Unidad de Informática',
    'Analista de Infraestructura TIC',
    'Administrador de Servidores',
    'Administrador de Redes',
    'Técnico en Redes y Comunicaciones',
    'Técnico en Soporte Técnico',
    'Especialista en Seguridad Informática',
    'Especialista en Ciberseguridad',
    'Desarrollador de Software',
    'Desarrollador Web',
    'Desarrollador Móvil (Android / iOS)',
    'Programador Full Stack',
    'Programador Frontend',
    'Programador Backend',
    'Analista Programador',
    'Arquitecto de Software',
    'Administrador de Base de Datos (DBA)',
    'Analista de Base de Datos',
    'Analista de Sistemas',
    'Analista de Requerimientos',
    'Analista de Calidad de Software (QA)',
    'Líder de Proyectos TIC',
    'Gerente de Proyectos TIC',
    'Analista de Datos',
    'Científico de Datos',
    'Especialista en Inteligencia Artificial',
    'Especialista en Business Intelligence',
    'Especialista en Gestión Documental Digital',
    'Analista de Telecomunicaciones',
    'Consultor TIC',
    'Pasante en Informática',
    'Pasante en Programación',
];

export const PERSON_STATUSES = ['Activo', 'Pendiente', 'Inactivo'];

export const DEPARTMENTS = [
    'Amazonas',
    'Anzoátegui',
    'Apure',
    'Aragua',
    'Barinas',
    'Bolívar',
    'Carabobo',
    'Cojedes',
    'Delta Amacuro',
    'Distrito Capital',
    'Falcón',
    'Guárico',
    'La Guaira',
    'Lara',
    'Mérida',
    'Miranda',
    'Monagas',
    'Nueva Esparta',
    'Portuguesa',
    'Sucre',
    'Táchira',
    'Trujillo',
    'Yaracuy',
    'Zulia'
];

export function createEntityId(prefix: string): string {
    const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
    return `${prefix}-${random}`.toUpperCase();
}

export function nextSequentialId(prefix: string, ids: string[]): string {
    const max = ids.reduce((acc, id) => {
        const value = Number(id.replace(/\D/g, ''));
        return Number.isFinite(value) ? Math.max(acc, value) : acc;
    }, 0);

    return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}
