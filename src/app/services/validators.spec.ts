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

    it('acepta cédulas venezolanas con prefijo V opcional', () => {
        expect(validateCedula('V-18745632')).toBeNull();
        expect(validateCedula('18745632')).toBeNull();
    });

    it('rechaza cédulas con prefijo extranjero o longitud inválida', () => {
        expect(validateCedula('A-18745632')).not.toBeNull();
        expect(validateCedula('V-1234567890')).not.toBeNull();
    });
});
