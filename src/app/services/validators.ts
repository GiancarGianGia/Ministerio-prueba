import { DOCUMENT_TYPES } from './models';

const VENEZUELAN_MOBILE_CODES = ['412', '414', '416', '424', '426'];

const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

/**
 * Valida nombres y apellidos: solo letras, espacios, tildes, diéresis, apóstrofes o guiones.
 * Longitud mínima de 2 y máxima de 60 caracteres.
 */
export function validatePersonName(value: string, fieldName = 'nombre'): string | null {
    const name = (value || '').trim();
    if (!name) {
        return `El ${fieldName} es obligatorio.`;
    }
    if (name.length < 2) {
        return `El ${fieldName} debe tener al menos 2 caracteres.`;
    }
    if (name.length > 60) {
        return `El ${fieldName} no puede exceder 60 caracteres.`;
    }
    if (!NAME_PATTERN.test(name)) {
        return `El ${fieldName} solo puede contener letras y espacios (sin números ni símbolos).`;
    }
    return null;
}

export function validateAcademicInstitution(value: string): string | null {
    const institution = (value || '').trim();
    if (!institution) {
        return null;
    }
    if (institution.length < 2 || institution.length > 120) {
        return 'El nombre de la universidad debe tener entre 2 y 120 caracteres.';
    }
    if (!/^[\p{L}\p{N}\s.'’\-()/&,]+$/u.test(institution)) {
        return 'El nombre de la universidad contiene caracteres no permitidos.';
    }
    return null;
}

export function validateAcademicCompletionYear(value: string | number): string | null {
    const yearText = String(value ?? '').trim();
    if (!yearText) {
        return null;
    }
    if (!/^\d{4}$/.test(yearText)) {
        return 'Escribe el año con cuatro dígitos.';
    }

    const year = Number(yearText);
    const currentYear = new Date().getFullYear();
    if (year < 1950 || year > currentYear + 10) {
        return `El año debe estar entre 1950 y ${currentYear + 10}.`;
    }
    return null;
}

export function isValidPersonName(value: string): boolean {
    return validatePersonName(value) === null;
}

export function isValidVenezuelanPhone(value: string): boolean {
    const phone = (value || '').trim();
    if (!/^\+?[\d\s().-]+$/.test(phone)) {
        return false;
    }

    let digits = phone.replace(/\D/g, '');

    if (!digits) {
        return false;
    }

    if (digits.startsWith('58')) {
        if (digits.length !== 12) {
            return false;
        }
        digits = digits.slice(2);
    } else if (digits.startsWith('0')) {
        if (digits.length !== 11 || phone.startsWith('+')) {
            return false;
        }
        digits = digits.slice(1);
    } else if (digits.length !== 10 || phone.startsWith('+')) {
        return false;
    }

    if (!/^\d{10}$/.test(digits)) {
        return false;
    }

    const code = digits.slice(0, 3);
    return VENEZUELAN_MOBILE_CODES.includes(code) || /^2\d{2}$/.test(code);
}

export function validatePhone(value: string): string | null {
    const phone = (value || '').trim();
    if (!phone) {
        return 'El teléfono es obligatorio.';
    }
    if (!isValidVenezuelanPhone(phone)) {
        return 'Escribe un teléfono de Venezuela válido (ej. +58 412 1234567 o 0412-1234567).';
    }
    return null;
}

export function validateBirthDate(value: string): string | null {
    if (!value || !value.trim()) {
        return 'La fecha de nacimiento es obligatoria.';
    }

    const dateError = validateCalendarBirthDate(value);
    if ('error' in dateError) {
        return dateError.error;
    }

    const { year, month, day } = dateError;

    const today = new Date();
    let age = today.getFullYear() - year;
    const birthdayPending = today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day);

    if (birthdayPending) {
        age--;
    }

    if (age < 14) {
        return 'El trabajador debe tener al menos 14 años de edad.';
    }

    if (age > 100) {
        return 'Revisa la fecha: la edad no puede superar los 100 años.';
    }

    return null;
}

export function validateChildBirthDate(value: string): string | null {
    if (!value || !value.trim()) {
        return 'La fecha de nacimiento del hijo/a es obligatoria.';
    }

    const dateError = validateCalendarBirthDate(value);
    if ('error' in dateError) {
        return dateError.error;
    }

    const today = new Date();
    const { year, month, day } = dateError;
    let age = today.getFullYear() - year;
    if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) {
        age--;
    }
    if (age > 100) {
        return 'Revisa la fecha: la edad no puede superar los 100 años.';
    }

    return null;
}

function validateCalendarBirthDate(value: string): { year: number; month: number; day: number } | { error: string } {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!match) {
        return { error: 'Escribe una fecha válida en formato AAAA-MM-DD.' };
    }

    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return { error: 'La fecha de nacimiento no es una fecha válida en el calendario.' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
        return { error: 'La fecha de nacimiento no puede ser una fecha futura.' };
    }

    return { year, month, day };
}

export function validateDocument(documentType: string, documentNumber: string): string | null {
    const type = (documentType || '').trim();
    const number = (documentNumber || '').trim();

    if (!type) {
        return 'Selecciona el tipo de documento.';
    }

    if (!DOCUMENT_TYPES.includes(type)) {
        return 'El tipo de documento seleccionado no es válido.';
    }

    if (!number) {
        return 'El número de documento es obligatorio.';
    }

    const clean = number.replace(/\s+/g, '').replace(/\./g, '');

    switch (type) {
        case 'Cédula de identidad': {
            if (!/^(?:[Vv]-?)?\d{5,9}$/.test(clean)) {
                return 'La Cédula de identidad debe contener entre 5 y 9 dígitos numéricos (ej. V-18745632 o 18745632).';
            }
            return null;
        }

        case 'Cédula de extranjería': {
            if (!/^(?:[Ee]-?)?\d{5,9}$/.test(clean)) {
                return 'La Cédula de extranjería debe contener entre 5 y 9 dígitos numéricos (ej. E-84123456).';
            }
            return null;
        }

        case 'RIF': {
            if (!/^[VEJGPCvejgpc]-?\d{8,9}(?:-?\d)?$/.test(clean)) {
                return 'El RIF debe tener un formato válido (ej. J-12345678-0 o V-12345678-9).';
            }
            return null;
        }

        case 'Pasaporte': {
            if (!/^[A-Za-z0-9]{6,15}$/.test(clean)) {
                return 'El pasaporte debe contener entre 6 y 15 caracteres alfanuméricos.';
            }
            return null;
        }

        default:
            return null;
    }
}

export function isValidDocument(documentType: string, documentNumber: string): boolean {
    return validateDocument(documentType, documentNumber) === null;
}

export function normalizeCedula(value: string): string {
    const clean = value.trim().replace(/[\s.]/g, '').toUpperCase();
    const digits = clean.replace(/^V-?/, '');
    return `V-${digits}`;
}

export function validateCedula(value: string): string | null {
    return validateDocument('Cédula de identidad', value);
}

export function validatePassword(password: string): string | null {
    if (!password) {
        return 'La contraseña es obligatoria.';
    }

    if (password.length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (password.length > 64) {
        return 'La contraseña no puede superar los 64 caracteres.';
    }

    if (/\s/.test(password)) {
        return 'La contraseña no puede contener espacios en blanco.';
    }

    if (!/[A-Za-z]/.test(password)) {
        return 'La contraseña debe incluir al menos una letra.';
    }

    if (!/\d/.test(password)) {
        return 'La contraseña debe incluir al menos un número.';
    }

    return null;
}

export function isValidPassword(password: string): boolean {
    return validatePassword(password) === null;
}

export function validatePasswordConfirmation(password: string, confirmPassword: string): string | null {
    if (!confirmPassword) {
        return 'Confirma la contraseña.';
    }

    if (password !== confirmPassword) {
        return 'Las contraseñas no coinciden.';
    }

    return null;
}
