import { validateAcademicCompletionYear, validateCedula, validatePhone } from './validators';

describe('validación de teléfonos y cédulas venezolanas', () => {
    it('acepta teléfonos móviles venezolanos en formato nacional e internacional', () => {
        expect(validatePhone('0412-1234567')).toBeNull();
        expect(validatePhone('+58 412 1234567')).toBeNull();
    });

    describe('validación de año académico', () => {
        it('acepta años almacenados como texto o como números heredados', () => {
            expect(validateAcademicCompletionYear('2020')).toBeNull();
            expect(validateAcademicCompletionYear(2020)).toBeNull();
        });
    });

    it('acepta teléfonos fijos venezolanos con código de área', () => {
        expect(validatePhone('0212-1234567')).toBeNull();
        expect(validatePhone('+58 212 1234567')).toBeNull();
    });

    it('rechaza teléfonos con caracteres o estructura que no corresponden a Venezuela', () => {
        expect(validatePhone('0412-ABC4567')).not.toBeNull();
        expect(validatePhone('+1 202 555 0100')).not.toBeNull();
        expect(validatePhone('58 0412 1234567')).not.toBeNull();
    });

    it('acepta cédulas venezolanas con el tipo de documento (V o E)', () => {
        expect(validateCedula('V-18745632')).toBeNull();
        expect(validateCedula('E-84123456')).toBeNull();
    });

    it('exige el tipo de documento y el número sin puntos', () => {
        expect(validateCedula('18745632')).toContain('tipo de documento');
        expect(validateCedula('V-18.745.632')).toContain('sin puntos');
    });

    it('rechaza cédulas con prefijo extranjero o longitud inválida', () => {
        expect(validateCedula('A-18745632')).not.toBeNull();
        expect(validateCedula('V-1234567890')).not.toBeNull();
    });
});
