export type UserRole = 'Administrador' | 'Registrador' | 'Consulta';

export type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

export interface AppUser {
    id: string;
    fullName: string;
    cedula: string;
    password: string;
    role: UserRole;
    active: boolean;
    createdAt: string;
    createdBy: string;
    lastLogin?: string;
}

export interface NewUserInput {
    fullName: string;
    cedula: string;
    password: string;
    role: UserRole;
    active: boolean;
}

export interface UpdateUserInput {
    fullName: string;
    cedula: string;
    role: UserRole;
    active: boolean;
    password?: string;
}

export interface ChildData {
    name: string;
    birthDate: string;
    documentNumber?: string;
}

export interface FamilyData {
    maritalStatus: string;
    spouseName?: string;
    spouseDocumentNumber?: string;
    spousePhone?: string;
    numberOfChildren: number;
    children?: ChildData[];
}

export interface VacationData {
    status: string;
    lastVacationStart?: string;
    lastVacationEnd?: string;
    pendingDays?: number;
    observations?: string;
}

export interface MedicalData {
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    bloodType?: string;
    allergies?: string;
    hasDisability: boolean;
    disabilityDescription?: string;
    hasPathology: boolean;
    pathologyDescription?: string;
    pathologyMedication?: string;
    observations?: string;
}

export interface HousingData {
    housingType?: string;
    housingCondition?: string;
    sector?: string;
    municipality?: string;
    zipCode?: string;
    yearsAtAddress?: number;
    numberOfRooms?: number;
    numberOfPeopleInHouse?: number;
    hasBasicServices: boolean;
    observations?: string;
}

export interface Person {
    id: string;
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
    birthDate: string;
    gender: string;
    phone: string;
    address: string;
    city: string;
    department: string;
    type: string;
    status: string;
    deactivationReason?: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    familyData?: FamilyData;
    vacationData?: VacationData;
    medicalData?: MedicalData;
    housingData?: HousingData;
}

export type NewPersonInput = Omit<Person, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'deactivationReason'>;

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

export const USER_ROLES: UserRole[] = ['Administrador'];

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

export const CITIES_BY_DEPARTMENT: Record<string, readonly string[]> = {
    Amazonas: ['Puerto Ayacucho', 'Maroa', 'San Fernando de Atabapo', 'La Esmeralda'],
    Anzoátegui: ['Barcelona', 'Puerto La Cruz', 'Lechería', 'Guanta', 'El Tigre', 'Anaco', 'Cantaura', 'Pariaguán'],
    Apure: ['San Fernando de Apure', 'Guasdualito', 'Biruaca', 'Achaguas', 'Elorza'],
    Aragua: ['Maracay', 'Turmero', 'Cagua', 'La Victoria', 'Palo Negro', 'El Limón', 'Villa de Cura'],
    Barinas: ['Barinas', 'Barinitas', 'Socopó', 'Sabaneta', 'Santa Bárbara'],
    Bolívar: ['Ciudad Bolívar', 'Ciudad Guayana', 'Puerto Ordaz', 'Upata', 'Caicara del Orinoco', 'Tumeremo'],
    Carabobo: ['Valencia', 'Puerto Cabello', 'Guacara', 'Mariara', 'Tocuyito', 'Naguanagua', 'San Diego'],
    Cojedes: ['San Carlos', 'Tinaquillo', 'El Baúl', 'Tinaco', 'El Pao'],
    'Delta Amacuro': ['Tucupita', 'Pedernales', 'Curiapo', 'Sierra Imataca'],
    'Distrito Capital': ['Caracas'],
    Falcón: ['Coro', 'Punto Fijo', 'Pueblo Nuevo', 'La Vela de Coro', 'Churuguara', 'Dabajuro'],
    Guárico: ['San Juan de los Morros', 'Calabozo', 'Valle de la Pascua', 'Zaraza', 'Altagracia de Orituco', 'Tucupido'],
    'La Guaira': ['La Guaira', 'Catia La Mar', 'Maiquetía', 'Caraballeda', 'Macuto', 'Naiguatá'],
    Lara: ['Barquisimeto', 'Cabudare', 'Carora', 'El Tocuyo', 'Quíbor', 'Duaca'],
    Mérida: ['Mérida', 'El Vigía', 'Ejido', 'Tovar', 'Nueva Bolivia', 'Lagunillas'],
    Miranda: ['Los Teques', 'Guarenas', 'Guatire', 'Petare', 'Cúa', 'Charallave', 'Santa Teresa del Tuy', 'Higuerote'],
    Monagas: ['Maturín', 'Punta de Mata', 'Caripito', 'Temblador', 'Caripe', 'Barrancas del Orinoco'],
    'Nueva Esparta': ['La Asunción', 'Porlamar', 'Pampatar', 'Juan Griego', 'El Valle del Espíritu Santo'],
    Portuguesa: ['Guanare', 'Acarigua', 'Araure', 'Turén', 'Biscucuy', 'Ospino'],
    Sucre: ['Cumaná', 'Carúpano', 'Güiria', 'Cumanacoa', 'Cariaco', 'Río Caribe'],
    Táchira: ['San Cristóbal', 'San Antonio del Táchira', 'Táriba', 'Rubio', 'La Fría', 'La Grita', 'San Juan de Colón'],
    Trujillo: ['Trujillo', 'Valera', 'Boconó', 'Carache', 'Sabana de Mendoza', 'La Puerta'],
    Yaracuy: ['San Felipe', 'Yaritagua', 'Chivacoa', 'Nirgua', 'Cocorote', 'Urachiche'],
    Zulia: ['Maracaibo', 'Cabimas', 'Ciudad Ojeda', 'Santa Rita', 'Machiques', 'Villa del Rosario', 'La Concepción']
};

export const MARITAL_STATUSES = [
    'Soltero/a',
    'Casado/a',
    'Unión estable de hecho / Concubinato',
    'Divorciado/a',
    'Viudo/a',
    'Separado/a de hecho',
    'Separado/a legalmente',
    'Comprometido/a',
    'Otro'
];

export const VACATION_STATUSES = ['No ha tomado vacaciones', 'Vacaciones tomadas', 'Solicitadas pendientes', 'Vacaciones parciales'];

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const HOUSING_TYPES = ['Casa', 'Apartamento', 'Habitación', 'Rancho', 'Otro'];

export const HOUSING_CONDITIONS = ['Propia', 'Alquilada', 'Familiar', 'Prestada', 'Otra'];

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
