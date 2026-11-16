export type UserRole = 'Administrador' | 'Registrador' | 'Consulta';

export type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

export interface SecurityQuestion {
    question: string;
    answer: string;
}

export const SECURITY_QUESTIONS = [
    '¿Cuál es el nombre de tu primera mascota?',
    '¿En qué ciudad naciste?',
    '¿Cuál es el nombre de tu madre?',
    '¿Cuál era el nombre de tu escuela primaria?',
    '¿Cuál es tu comida favorita?',
    '¿Cuál es el apellido de soltera de tu abuela materna?',
    '¿Cuál fue tu primer trabajo?',
    '¿Cuál es el nombre de tu mejor amigo de la infancia?'
];

export interface AppUser {
    id: string;
    fullName: string;
    cedula: string;
    password: string;
    role: UserRole;
    active: boolean;
    createdAt: string;
    createdBy: string;
    deactivatedBy?: string;
    lastLogin?: string;
    securityQuestions?: SecurityQuestion[];
}

export interface NewUserInput {
    fullName: string;
    cedula: string;
    password: string;
    role: UserRole;
    active: boolean;
    securityQuestions?: SecurityQuestion[];
}

export interface UpdateUserInput {
    fullName: string;
    cedula: string;
    role: UserRole;
    active: boolean;
    password?: string;
    securityQuestions?: SecurityQuestion[];
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
    spouseWorksAtMpppst?: boolean;
    spouseMpppstDepartment?: string;
    numberOfChildren: number;
    children?: ChildData[];
}

export interface FamilyMember {
    hasDocument: boolean;
    documentType?: string;
    documentNumber?: string;
    firstName?: string;
    secondName?: string;
    lastName?: string;
    secondLastName?: string;
    gender?: string;
    birthDate?: string;
    maritalStatus?: string;
    relationship?: string;
    personalPhoneCode?: string;
    personalPhone?: string;
    homePhoneCode?: string;
    homePhone?: string;
    email?: string;
    laterality?: string;
    hasDisability: boolean;
    disabilityType?: string;
    disabilityGrade?: string;
    conapdisCode?: string;
    hasAllergies: boolean;
    allergyTypes?: string;
    observations?: string;
    adoptedOrFoster: boolean;
    courtRegistryNumber?: string;
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
    secondaryEmergencyContactName?: string;
    secondaryEmergencyContactPhone?: string;
    bloodType?: string;
    laterality?: string;
    hasOccupationalDisease: boolean;
    occupationalDiseaseDescription?: string;
    hasDisability: boolean;
    disabilityType?: string;
    disabilityGrade?: string;
    conapdisCode?: string;
    disabilityDescription?: string;
    hasPathology: boolean;
    pathologyDescription?: string;
    pathologyMedication?: string;
    allergies?: string;
    observations?: string;
}

export interface HousingData {
    municipality?: string;
    parish?: string;
    thoroughfareType?: string;
    thoroughfareDetails?: string;
    buildingType?: string;
    buildingDetails?: string;
    unitType?: string;
    unitDetails?: string;
    zoneType?: string;
    zoneDetails?: string;
    referencePoint?: string;
    housingType?: string;
    housingCondition?: string;
    yearsAtAddress?: number;
    numberOfRooms?: number;
    numberOfPeopleInHouse?: number;
    hasBasicServices: boolean;
    observations?: string;
}

export interface AdditionalData {
    militaryRegistration?: string;
    militaryRegistrationNumber?: string;
    shirtSize?: string;
    pantsSize?: string;
    shoeSize?: string;
    jacketSize?: string;
    observations?: string;
}

export interface LaborData {
    administrativeLocation?: string;
    administrativeState?: string;
    physicalLocation?: string;
    officePhoneCode?: string;
    officePhone?: string;
    titularPosition?: string;
    workerType?: string;
    payrollCode?: string;
    mpppstEntryDate?: string;
    publicAdministrationEntryDate?: string;
    observations?: string;
}

export interface AcademicData {
    academicLevel?: string;
    specialty?: string;
    graduated?: boolean;
    university?: string;
    completionYear?: string;
    continueStudies?: string;
    studyOptions?: string;
    wantsToFacilitate?: boolean;
}

export interface Person {
    academicData?: AcademicData;
    id: string;
    firstName: string;
    secondName?: string;
    lastName: string;
    secondLastName?: string;
    documentType: string;
    documentNumber: string;
    birthPlace?: string;
    birthDate: string;
    gender: string;
    phone: string;
    homePhone?: string;
    email?: string;
    rif?: string;
    address: string;
    city: string;
    department: string;
    type: string;
    status: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    familyData?: FamilyData;
    familyMembers?: FamilyMember[];
    vacationData?: VacationData;
    medicalData?: MedicalData;
    housingData?: HousingData;
    additionalData?: AdditionalData;
    laborData?: LaborData;
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
    incorrectQuestions?: string[];
}

export const STORAGE_KEYS = {
    users: 'registro.usuarios.v1',
    session: 'registro.sesion.v1',
    persons: 'registro.personas.v3',
    logs: 'registro.actividad.v2'
} as const;

export const USER_ROLES: UserRole[] = ['Administrador'];

export const DOCUMENT_TYPES = ['Cédula de identidad', 'Pasaporte', 'Cédula de extranjería', 'RIF'];

export interface DocumentPrefixOption {
    value: string;
    label: string;
    documentType: string;
    title: string;
}

export const DOCUMENT_PREFIX_OPTIONS: DocumentPrefixOption[] = [
    { value: 'V', label: 'V', documentType: 'Cédula de identidad', title: 'V — Venezolano (Cédula de identidad)' },
    { value: 'E', label: 'E', documentType: 'Cédula de extranjería', title: 'E — Extranjero (Cédula de extranjería)' },
    { value: 'P', label: 'P', documentType: 'Pasaporte', title: 'P — Pasaporte' },
    { value: 'J', label: 'J', documentType: 'RIF', title: 'J — Jurídico (RIF)' },
    { value: 'G', label: 'G', documentType: 'RIF', title: 'G — Gobierno (RIF)' },
    { value: 'C', label: 'C', documentType: 'RIF', title: 'C — Consejo comunal (RIF)' }
];

export const USER_DOCUMENT_PREFIX_OPTIONS: DocumentPrefixOption[] = DOCUMENT_PREFIX_OPTIONS.filter(
    (option) => option.value === 'V' || option.value === 'E'
);

export const GENDERS = ['Femenino', 'Masculino'];

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

export const PERSON_STATUSES = ['Activo', 'Pendiente', 'Egresado'];

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

export const MUNICIPALITIES_BY_STATE: Record<string, readonly string[]> = {
    Amazonas: ['Alto Orinoco', 'Atabapo', 'Atures', 'Autana', 'Manapiare', 'Maroa', 'Río Negro'],
    Anzoátegui: ['Anaco', 'Aragua', 'Diego Bautista Urbaneja', 'Fernando de Peñalver', 'Francisco del Carmen Carrión', 'Francisco de Miranda', 'Guanta', 'Independencia', 'José Gregorio Monagas', 'Juan Antonio Sotillo', 'Juan Manuel Cajigal', 'Libertad', 'Manuel Ezequiel Bruzual', 'Pedro María Freites', 'Píritu', 'San José de Guanipa', 'San Juan de Capistrano', 'Santa Ana', 'Simón Bolívar', 'Simón Rodríguez', 'Sir Arthur McGregor'],
    Apure: ['Achaguas', 'Biruaca', 'Muñoz', 'Páez', 'Pedro Camejo', 'Rómulo Gallegos', 'San Fernando'],
    Aragua: ['Bolívar', 'Camatagua', 'Francisco Linares Alcántara', 'Girardot', 'José Ángel Lamas', 'José Félix Ribas', 'José Rafael Revenga', 'Libertador', 'Mario Briceño Iragorry', 'Ocumare de la Costa de Oro', 'San Casimiro', 'San Sebastián', 'Santiago Mariño', 'Santos Michelena', 'Sucre', 'Tovar', 'Urdaneta', 'Zamora'],
    Barinas: ['Alberto Arvelo Torrealba', 'Andrés Eloy Blanco', 'Antonio José de Sucre', 'Arismendi', 'Barinas', 'Bolívar', 'Cruz Paredes', 'Ezequiel Zamora', 'Obispos', 'Pedraza', 'Rojas', 'Sosa'],
    Bolívar: ['Caroní', 'Cedeño', 'El Callao', 'Gran Sabana', 'Heres', 'Padre Pedro Chien', 'Piar', 'Raúl Leoni', 'Roscio', 'Sifontes', 'Sucre'],
    Carabobo: ['Bejuma', 'Carlos Arvelo', 'Diego Ibarra', 'Guacara', 'Juan José Mora', 'Libertador', 'Los Guayos', 'Miranda', 'Montalbán', 'Naguanagua', 'Puerto Cabello', 'San Diego', 'San Joaquín', 'Valencia'],
    Cojedes: ['Anzoátegui', 'Falcón', 'Girardot', 'Lima Blanco', 'Pao de San Juan Bautista', 'Ricaurte', 'Rómulo Gallegos', 'San Carlos', 'Tinaco'],
    'Delta Amacuro': ['Antonio Díaz', 'Casacoima', 'Pedernales', 'Tucupita'],
    'Distrito Capital': ['Libertador'],
    Falcón: ['Acosta', 'Bolívar', 'Buchivacoa', 'Cacique Manaure', 'Carirubana', 'Colina', 'Dabajuro', 'Democracia', 'Falcón', 'Federación', 'Jacura', 'Los Taques', 'Mauroa', 'Miranda', 'Mons. Iturriza', 'Palmasola', 'Petit', 'Píritu', 'San Francisco', 'Silva', 'Sucre', 'Tocópero', 'Unión', 'Urumaco', 'Zamora'],
    Guárico: ['Camaguán', 'Chaguaramas', 'El Socorro', 'Francisco de Miranda', 'José Félix Ribas', 'José Tadeo Monagas', 'Juan Germán Roscio', 'Julián Mellado', 'Las Mercedes', 'Leonardo Infante', 'Ortiz', 'Pedro Zaraza', 'Rondón', 'San Gerónimo de Guayabal', 'San José de Guaribe'],
    'La Guaira': ['Vargas'],
    Lara: ['Andrés Eloy Blanco', 'Crespo', 'Iribarren', 'Jiménez', 'Morán', 'Palavecino', 'Simón Planas', 'Torres', 'Urdaneta'],
    Mérida: ['Alberto Adriani', 'Andrés Bello', 'Antonio Pinto Salinas', 'Aricagua', 'Arzobispo Chacón', 'Campo Elías', 'Caracciolo Parra Olmedo', 'Cardenal Quintero', 'Guaraque', 'Julio César Salas', 'Justo Briceño', 'Libertador', 'Miranda', 'Obispo Ramos de Lora', 'Padre Noguera', 'Pueblo Llano', 'Rangel', 'Rivas Dávila', 'Santos Marquina', 'Sucre', 'Tovar', 'Tulio Febres Cordero', 'Zea'],
    Miranda: ['Acevedo', 'Andrés Bello', 'Baruta', 'Brión', 'Buroz', 'Carrizal', 'Chacao', 'Cristóbal Rojas', 'El Hatillo', 'Guaicaipuro', 'Independencia', 'Lander', 'Los Salias', 'Páez', 'Paz Castillo', 'Pedro Gual', 'Plaza', 'Simón Bolívar', 'Sucre', 'Urdaneta', 'Zamora'],
    Monagas: ['Acosta', 'Aguasay', 'Bolívar', 'Caripe', 'Cedeño', 'Ezequiel Zamora', 'Libertador', 'Maturín', 'Piar', 'Punceres', 'Santa Bárbara', 'Sotillo', 'Uracoa'],
    'Nueva Esparta': ['Antolín del Campo', 'Arismendi', 'Díaz', 'García', 'Gómez', 'Maneiro', 'Marcano', 'Mariño', 'Península de Macanao', 'Tubores', 'Villalba'],
    Portuguesa: ['Agua Blanca', 'Araure', 'Esteller', 'Guanare', 'Guanarito', 'Mons. José Vicente de Unda', 'Ospino', 'Páez', 'Papelón', 'San Genaro de Boconoíto', 'San Rafael de Onoto', 'Santa Rosalía', 'Sucre', 'Turén'],
    Sucre: ['Andrés Eloy Blanco', 'Andrés Mata', 'Arismendi', 'Benítez', 'Bermúdez', 'Bolívar', 'Cajigal', 'Cruz Salmerón Acosta', 'Libertador', 'Mariño', 'Mejía', 'Montes', 'Ribero', 'Sucre', 'Valdez'],
    Táchira: ['Andrés Bello', 'Antonio Rómulo Costa', 'Ayacucho', 'Bolívar', 'Cárdenas', 'Córdoba', 'Fernández Feo', 'Francisco de Miranda', 'García de Hevia', 'Guásimos', 'Independencia', 'Jáuregui', 'José María Vargas', 'Junín', 'Libertad', 'Libertador', 'Lobatera', 'Michelena', 'Panamericano', 'Pedro María Ureña', 'Rafael Urdaneta', 'Samuel Darío Maldonado', 'San Cristóbal', 'San Judas Tadeo', 'Seboruco', 'Simón Rodríguez', 'Sucre', 'Torbes', 'Uribante'],
    Trujillo: ['Andrés Bello', 'Boconó', 'Bolívar', 'Candelaria', 'Carache', 'Escuque', 'José Felipe Márquez Cañizales', 'Juan Vicente Campo Elías', 'La Ceiba', 'Miranda', 'Monte Carmelo', 'Motatán', 'Pampán', 'Pampanito', 'Rafael Rangel', 'San Rafael de Carvajal', 'Sucre', 'Trujillo', 'Urdaneta', 'Valera'],
    Yaracuy: ['Arístides Bastidas', 'Bolívar', 'Bruzual', 'Cocorote', 'Independencia', 'José Antonio Páez', 'La Trinidad', 'Manuel Monge', 'Nirgua', 'Peña', 'San Felipe', 'Sucre', 'Urachiche', 'Veroes'],
    Zulia: ['Almirante Padilla', 'Baralt', 'Cabimas', 'Catatumbo', 'Colón', 'Francisco Javier Pulgar', 'Jesús Enrique Lossada', 'Jesús María Semprún', 'La Cañada de Urdaneta', 'Lagunillas', 'Machiques de Perijá', 'Mara', 'Maracaibo', 'Miranda', 'Rosario de Perijá', 'San Francisco', 'Santa Rita', 'Simón Bolívar', 'Sucre', 'Valmore Rodríguez', 'Villa del Rosario']
};

export const PARISHES_BY_MUNICIPALITY: Record<string, readonly string[]> = {
    'Distrito Capital::Libertador': ['23 de Enero', 'Altagracia', 'Antímano', 'Caricuao', 'Catedral', 'Coche', 'El Junquito', 'El Paraíso', 'El Recreo', 'El Valle', 'La Candelaria', 'La Pastora', 'La Vega', 'Macarao', 'San Agustín', 'San Bernardino', 'San José', 'San Juan', 'San Pedro', 'Santa Rosalía', 'Santa Teresa', 'Sucre'],
    'Miranda::Baruta': ['Baruta', 'El Cafetal', 'Las Minas de Baruta'],
    'Miranda::Carrizal': ['Carrizal'],
    'Miranda::Chacao': ['Chacao'],
    'Miranda::El Hatillo': ['El Hatillo'],
    'Miranda::Los Salias': ['San Antonio de los Altos'],
    'Miranda::Sucre': ['Caucagüita', 'Filas de Mariche', 'La Dolorita', 'León de Caracas', 'Petare'],
    'La Guaira::Vargas': ['Caraballeda', 'Caruao', 'Catia La Mar', 'El Junko', 'La Guaira', 'Macuto', 'Maiquetía', 'Naiguatá', 'Urimare'],
    'Aragua::Girardot': ['Andrés Eloy Blanco', 'José Casanova Godoy', 'Joaquín Crespo', 'Las Delicias', 'Los Tacariguas', 'Madre María de San José', 'Pedro José Ovalles'],
    'Bolívar::Caroní': ['Cachamay', 'Chirica', 'Dalla Costa', 'Once de Abril', 'Pozo Verde', 'Simón Bolívar', 'Unare', 'Universidad', 'Vista al Sol', 'Yocoima'],
    'Bolívar::Heres': ['Agua Salada', 'Catedral', 'José Antonio Páez', 'La Sabanita', 'Marhuanta', 'Panapana', 'Vista Hermosa'],
    'Carabobo::Valencia': ['Candelaria', 'Catedral', 'El Socorro', 'Miguel Peña', 'Negro Primero', 'Rafael Urdaneta', 'San Blas', 'San José', 'Santa Rosa'],
    'Lara::Iribarren': ['Aguedo Felipe Alvarado', 'Ana Soto', 'Buena Vista', 'Concepción', 'El Cují', 'Juárez', 'Juan de Villegas', 'Rómulo Betancourt', 'Santa Rosa', 'Tamaca', 'Unión'],
    'Táchira::San Cristóbal': ['Catedral', 'La Concordia', 'Pedro María Morantes', 'San Juan Bautista', 'San Sebastián'],
    'Zulia::Maracaibo': ['Antonio Borjas Romero', 'Cacique Mara', 'Caracciolo Parra Pérez', 'Cecilio Acosta', 'Chiquinquirá', 'Coquivacoa', 'Cristo de Aranza', 'Francisco Eugenio Bustamante', 'Idelfonso Vásquez', 'Juana de Ávila', 'Luis Hurtado Higuera', 'Manuel Dagnino', 'Olegario Villalobos', 'Raúl Leoni', 'San Isidro', 'Santa Lucía', 'Venancio Pulgar']
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

export const FAMILY_RELATIONSHIPS = [
    'Madre',
    'Padre',
    'Cónyuge',
    'Hijo/a',
    'Hermano/a',
    'Abuelo/a',
    'Nieto/a',
    'Tío/a',
    'Primo/a',
    'Sobrino/a',
    'Otro'
];

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const HOUSING_TYPES = ['Casa', 'Apartamento', 'Habitación', 'Rancho', 'Otro'];

export const HOUSING_CONDITIONS = ['Propia', 'Alquilada', 'Familiar', 'Prestada', 'Otra'];

export const ADDRESS_THOROUGHFARE_TYPES = ['Avenida', 'Calle', 'Carretera', 'Esquina', 'Vereda'];

export const ADDRESS_BUILDING_TYPES = ['Casa', 'Edificio', 'Quinta'];

export const ADDRESS_UNIT_TYPES = ['Apt', 'Local', 'Oficina'];

export const ADDRESS_ZONE_TYPES = ['Barrio', 'Caserío', 'Conjunto residencial', 'Sector', 'Urbanización', 'Zona'];

export const LATERALITY_OPTIONS = ['Diestro', 'Zurdo', 'Ambidiestro'];

export const DISABILITY_TYPES = [
    'Física / Motora',
    'Visual',
    'Auditiva',
    'Intelectual',
    'Psicosocial / Mental',
    'Múltiple',
    'Otra'
];

export const DISABILITY_GRADES = ['Leve', 'Moderada', 'Severa', 'Grave / Completa'];

export const MILITARY_REGISTRATION_OPTIONS = [
    'Inscrito',
    'No inscrito',
    'En trámite',
    'Exento'
];

export const SHIRT_SIZES = ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

export const PANTS_SIZES = ['26', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48'];

export const SHOE_SIZES = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

export const JACKET_SIZES = ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

export const PERSONAL_PHONE_CODES = ['0412', '0414', '0416', '0424', '0426'];

export const OFFICE_PHONE_CODES = [
    '0212',
    '0234',
    '0235',
    '0238',
    '0239',
    '0240',
    '0241',
    '0242',
    '0243',
    '0244',
    '0245',
    '0246',
    '0247',
    '0248',
    '0249',
    '0251',
    '0252',
    '0253',
    '0254',
    '0255',
    '0256',
    '0257',
    '0258',
    '0259',
    '0261',
    '0262',
    '0263',
    '0264',
    '0265',
    '0266',
    '0267',
    '0268',
    '0269',
    '0271',
    '0272',
    '0273',
    '0274',
    '0275',
    '0276',
    '0277',
    '0278',
    '0281',
    '0282',
    '0283',
    '0284',
    '0285',
    '0286',
    '0287',
    '0288',
    '0289',
    '0291',
    '0292',
    '0293',
    '0294',
    '0295'
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
